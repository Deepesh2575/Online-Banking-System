const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            return res.status(403).json({ message: 'No token provided' });
        }

        // Handle both "Bearer token" and just "token" formats
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.split(' ')[1] 
            : authHeader;

        if (!token) {
            return res.status(403).json({ message: 'Token is required' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ message: 'Token expired. Please login again' });
                }
                if (err.name === 'JsonWebTokenError') {
                    return res.status(401).json({ message: 'Invalid token' });
                }
                return res.status(401).json({ message: 'Unauthorized' });
            }
            req.userId = decoded.id;
            next();
        });
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(500).json({ message: 'Server error during authentication' });
    }
};

module.exports = verifyToken;

