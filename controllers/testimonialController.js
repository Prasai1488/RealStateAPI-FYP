import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";



// Controller to add a new testimonial
export const addTestimonial = async (req, res) => {
    const { rating, comment } = req.body;
    const tokenUserId = req.userId;

    // Validate rating value
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    try {
        // Creating a new testimonial with the provided data
        const newTestimonial = await prisma.testimonial.create({
            data: {
                userId: tokenUserId,
                rating,
                comment,
            },
        });

        // Sending a success response with the created testimonial
        res.status(200).json(newTestimonial);
    } catch (err) {
        // Logging the error and sending a failure response
        console.log(err);
        res.status(500).json({ message: "Failed to create testimonial" });
    }
};

// Controller to get all testimonials
export const getTestimonials = async (req, res) => {
    try {
        const testimonials = await prisma.testimonial.findMany({
            include: { user: true },
        });
        res.status(200).json(testimonials);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error fetching testimonials' });
    }
};

// Controller to update a testimonial
export const updateTestimonial = async (req, res) => {
    const { rating, comment } = req.body;
    const testimonialId = req.params.testimonialId;

    // Validate rating value
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    try {
        const updatedTestimonial = await prisma.testimonial.update({
            where: { id: testimonialId },
            data: { rating, comment },
        });

        res.status(200).json(updatedTestimonial);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error updating testimonial' });
    }
};


// delete a testimonial
export const deleteTestimonial = async (req, res) => {
    const testimonialId = req.params.testimonialId;
    const tokenUserId = req.userId;

    try {
        // Fetch the testimonial to be deleted
        const testimonial = await prisma.testimonial.findUnique({
            where: { id: testimonialId },
        });

        // If the testimonial is not found, return a 404 response
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        // If the authenticated user is not the owner of the testimonial, return a 403 response
        if (testimonial.userId !== tokenUserId) {
            return res.status(403).json({ message: 'Not Authorized!' });
        }

        // Delete the testimonial
        await prisma.testimonial.delete({
            where: { id: testimonialId },
        });

        // Sending a success response indicating the testimonial was deleted
        res.status(200).json({ message: 'Testimonial deleted successfully' });
    } catch (error) {
        // Logging the error and sending a failure response
        console.log(error);
        res.status(500).json({ message: 'Error deleting testimonial' });
    }
};