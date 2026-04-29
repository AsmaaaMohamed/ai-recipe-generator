import jwt from 'jsonwebtoken';

const authMiddleware = async (req, res, next) => {
    try{
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
       if (!token) {
            return res.status(401).json({success:false, message: 'No token found' });
        }
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }catch(error){
        res.status(401).json({ message: 'Unauthorized' });
    }
}

export default authMiddleware