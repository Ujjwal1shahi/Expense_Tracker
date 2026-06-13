import { pool } from "../libs/database";

export const getTransaction = async (req, res) => {
  try {
    const today = new Date();
    const _sevenDaysAgo = new Date(today);
    _sevenDaysAgo.setDate(today.getDate() - 7);

    const sevenDaysAgo = _sevenDaysAgo.toISOString().split("T")[0];
    const { df, dt, s } = req.query;
    const { userId } = req.body.userId;
    const startDate = new Date(df || sevenDaysAgo);
    const endDate = new Date(dt || new Date());

    const transaction = await pool({
      text: `SELECT * FROM tbltransaction WHERE user_id = $1 AND createdat BETWEEN $2 AND $3 AND (description ILIKE '%' || $4 || '%' OR status ILIKE '%' || $4 || '%' OR source ILIKE '%' || $4 || '%') ORDER BY id DESC`,
      values: [userId, startDate, endDate, s],
    });

    res.status(200).json({
      status: "success",
      data: transactions.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};

export const getDashboardInformation = async (req, res) => {
  try {
    const { userId } = req.body.user;

    const totalIncome = 0;
    const totalExpense = 0;

    const transactionResult = await pool.query({
      text: `SELECT type, SUM(amount) as totalAmount from tbltransaction WHERE user_id = $1 GROUP BY type`,
      values: [userId],
    });

    const transactions = transactionResult.rows;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        totalIncome += transaction.totalamount;
      } else {
        totalExpense += transaction.totalamount;
      }
    });

    const availableBalance = totalIncome - totalExpense;

    const year = new Date().getFullYear();
    const start_Date = new Date(year, 0, 1); // January 1st of the year
    const end_Date = new Date(year, 11, 31, 23, 59, 59); // December end of the year (till 23 : 59 : 59 pm)

    const result = await pool.query({
      text: `SELECT
                EXTRACT(MONTH FROM createdat) AS month,
                type,
                SUM(amount) AS totalAmount
                FROM
                tbltransaction
                WHERE
                user_id = $1
                AND createdat BETWEEN $2 AND $3
                GROUP BY
                EXTRACT(MONTH FROM createdat), type`,
      values: [userId, start_Date, end_Date],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};

export const addTransaction = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { account_id } = req.params;
    const { description, source, amount } = req.body;

    if (!(description || source || amount)) {
      return res.status(403).json({
        status: "failed",
        message: "Provide Required Fields!",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(403).json({
        status: "failed",
        message: "Amount should be greater than 0.",
      });
    }

    const result = await pool.query({
      text: `SELECT * FROM tblaccount WHERE id = $1`,
      values: [account_id],
    });

    const accountInfo = result.rows[0];

    if (!accountInfo) {
      return res.status(404).json({
        status: "failed",
        message: "Invalid account information.",
      });
    }

    if (
      accountInfo.account_balance <= 0 ||
      accountInfo.account_balance < Number(amount)
    ) {
      return res.status(403).json({
        status: "failed",
        message: "Transaction failed. Insufficient Balance!",
      });
    }

    // Begin Transaction
    await pool.query("BEGIN");

    await pool.query({
      text: `UPDATE tblaccount SET account_balance = account_balance - $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2`,
      values: [amount, account_id],
    });

    await pool.query({
      text: `INSERT INTO tbltransaction(user_id, description, type, status, amount, source) VALUES($1, $2, $3, $4, $5, $6)`,
      values: [userId, description, "expense", "completed", amount, source],
    });

    await pool.query("Commit");

    res.status(200).json({
      success: "success",
      message: "Transaction completed successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};

export const transferMoneyToAccount = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { from_account, to_account, amount } = req.body;

    if (!(from_account || to_account || amount)) {
      return res.status(403).json({
        status: "failed",
        message: "Provide Required Fields!",
      });
    }

    const newAmount = Number(amount);

    if (newAmount <= 0) {
      return res.status(403).json({
        status: "failed",
        message: "Amount should be greater than 0.",
      });
    }

    const fromAccountResult = await pool.query({
      text: `SELECT * FROM tblaccount WHERE id = $1`,
      values: [from_account],
    });

    const fromAccount = fromAccountResult.rows[0];

    if (!fromAccount) {
      return res.status(404).json({
        status: "failed",
        message: "Account information not found.",
      });
    }

    if (newAmount > fromAccount.account_balance) {
      return res.status(403).json({
        status: "failed",
        message: "Transfer failed. Insufficient account balance.",
      });
    }

    await pool.query("BEGIN");

    await pool.query({
      text: `UPDATE tblaccount SET account_balance = account_balance - $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2`,
      values: [newAmount, from_account],
    });

    const toAccount = await pool.query({
      text: `UPDATE tblaccount SET account_balance = $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      values: [newAmount, to_account],
    });

    const description = `Transfer (${fromAccount.account_name} - ${toAccount.rows[0].account_name})`;

    await pool.query({
      text: `INSERT INTO tbltransaction(user_id, description, type, status, amount, source) VALUES($1, $2, $3, $4, $5, $6)`,
      values: [
        userId,
        description,
        "expense",
        "completed",
        amount,
        fromAccount.account_name,
      ],
    });

    const description1 = `Received (${fromAccount.account_name} - ${toAccount.rows[0].account_name})`;

    await pool.query({
      text: `INSERT INTO tbltransaction(user_id, description, type, status, amount, source) VALUES($1, $2, $3, $4, $5, $6)`,
      values: [
        userId,
        description1,
        "income",
        "Completed",
        amount,
        toAccount.rows[0].account_name,
      ],
    });

    await pool.query("COMMIT");
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};
