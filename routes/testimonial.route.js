import  express  from "express";
import { addTestimonial,getTestimonials,updateTestimonial,deleteTestimonial } from "../controllers/testimonialController.js";
import { verifyToken } from "../middleware/verifyToken.js";


const router = express.Router();

router.post('/post-testimonials', verifyToken, addTestimonial);
router.get('/get-testimonials', getTestimonials);
router.put('/update-testimonials/:testimonialId', verifyToken, updateTestimonial);
router.delete('/delete-testimonials/:testimonialId', verifyToken, deleteTestimonial);

export default router;