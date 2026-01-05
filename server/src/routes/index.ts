import { Router } from 'express';
import theoryController from '../controllers/theoryController';
import voteController from '../controllers/voteController';
import stanceController from '../controllers/stanceController';
import commentController from '../controllers/commentController';
import userController from '../controllers/userController';
import searchController from '../controllers/searchController';
import adminController from '../controllers/adminController';

const router = Router();

// Mount routes
router.use('/theories', theoryController);
router.use('/votes', voteController);
router.use('/stances', stanceController);
router.use('/comments', commentController);
router.use('/users', userController);
router.use('/search', searchController);
router.use('/admin', adminController);

export default router;
