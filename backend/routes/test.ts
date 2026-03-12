// Test route registration
import { Router } from 'express';
import { getTest } from '../controllers/testController';

const router = Router();

// GET / -> returns a JSON message indicating the server is running
router.get('/', getTest);

export default router;
