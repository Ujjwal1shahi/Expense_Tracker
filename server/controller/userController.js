import { comparePassword, hashPassword } from "../libs";

export const getUser = async (req, res) => {
    try {
        
    } catch (error) {
        console.log(error);
        req.status(500).json({
            status: "failed",
            message: error.message
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        
        const {userId} = req.body.user;

        const { currentPassword, newPassword, confirmPassword } = req.body;

        const userExist = await pool.query({
            text: `SELECT * FROM tbluser WHERE id = $1`,
            values: [userId],
        });

        const user = userExist.rows[0];

        if(!user){
            return res.status(404).json({
                status: "failed",
                message: "User not found."
            })
        }

        if(newPassword !== confirmPassword){
            return res.status(401).json({
                status: "failed",
                message: "New Password does not match.",
            });
        }

        const isMatch = await comparePassword(currentPassword, user?.password);

        if(!isMatch){
            return res.status(401).json({
                status: "failed",
                message: "Invalid current password."
            });
        }

        const hashedPassword = await hashPassword(newPassword);

        await pool.query({
            text: `UPDATE tbluser SET password = $1 WHERE id = $2`,
            values: [hashedPassword, userId],
        });

        res.status(200).json({
            status: "success",
            message: "Password changed successfully",
        });

    } catch (error) {
        console.log(error);
        req.status(500).json({
            status: "failed",
            message: error.message
        });
    }
};

export const updateUser = async (req, res) => {
    try {

        const { userId } = req.body.user;
        const { firstName, lastName, country, currency, contact } = req.body;

        const userExist = await pool.query({
            text: `SELECT * FROM tbluser WHERE id = $1`,
            values: [userId],
        });

        const user = userExist.rows[0];

        if(!user){
            return res.status(404).json({
                status: "failed",
                message: "User not found."
            });
        }

        const updateUser = await pool.query({
            text: `UPDATE tbluser SET firstName = $1, lastName = $2, country = $3, currency = $4, contact = $5, updatedar = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,

            values: [firstName, lastName, country, currency, contact, userId]
        });

        updateUser.rows[0].password = undefinedl

        res.status(200).json({
            status: "success",
            message: "User information updated successfully",
            user: updateUser.rows[0],
        });

    } catch (error) {
        console.log(error);
        req.status(500).json({
            status: "failed",
            message: error.message
        });
    }
};