// File: src/models/user.js
const db = require('../config/db_config');
const bcrypt = require('bcrypt');

/**
 * 用户相关数据库操作
 */
class User {
    /**
     * 通过用户名查找用户
     * @param {string} username 
     * @returns {Promise<Object|null>}
     */
    static async findByUsername(username) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE username = ?', [username]
            );

            return rows[0] || null;
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw error;
        }
    }

    /**
     * 通过 ID 查找用户
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE id = ?', [id]
            );

            return rows[0] || null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }

    /**
     * 创建用户
     * @param {Object} user({ username, password, email })
     * @returns {Promise<number>}
     */
    static async createUser(user) {
        try {
            const { username, password, email } = user;

            const [rows] = await db.query(
                'SELECT * FROM users WHERE username = ?', [username]
            );

            if (rows.length > 0) {
                throw new Error(`User ${username} already exists`);
            }

            const hashedPassword = await this.hashPassword(password);
            const [result] = await db.execute(
                'INSERT INTO users (username, passwd_hash, email) VALUES (?, ?, ?)', [username, hashedPassword, email]
            );

            return result.insertId;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * 删除用户
     * @param {number} id 
     * @returns {Promise<boolean>}
     */
    static async deleteUser(id) {
        try {
            const [result] = await db.execute(
                'DELETE FROM users WHERE id = ?', [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * 修改密码
     * @param {number} id 
     * @param {string} newPassword 
     * @returns 
     */
    static async updatePassword(id, newPassword) {
        try {
            const hashedPassword = await this.hashPassword(newPassword);
            const [result] = await db.execute(
                'UPDATE users SET passwd_hash = ? WHERE id = ?', [hashedPassword, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    }

    /**
     * 更新用户信息(username, qq_id, netease_id)
     * @param {object} user 
     * @returns {Promise<boolean>}
     */
    static async updateUser(user) {
        try {
            const { id, username, qq_id, netease_id } = user;

            const [rows] = await db.execute(
                'SELECT * FROM users WHERE id = ?', [id]
            );

            if (rows.length === 0) {
                throw new Error(`User with ID ${id} does not exist`);
            }

            await db.execute(
                'UPDATE users SET username = ?, qq_id = ?, netease_id = ? WHERE id = ?',
                [username, qq_id, netease_id, id]
            );

            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * 获取用户信息(id, username, email, qq_id, netease_id)
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    static async getUserInfo(id) {
        try {
            const [rows] = await db.execute(
                'SELECT id, username, email, qq_id, netease_id FROM users WHERE id = ?', [id]
            );

            return rows[0] || null;
        } catch (error) {
            console.error('Error getting user info:', error);
            throw error;
        }
    }

    static async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
}


module.exports = User;