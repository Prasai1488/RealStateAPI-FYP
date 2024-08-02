// import { PrismaClient } from "@prisma/client";


// // controller to add reviews and comments 

//     export const addReviewAndComment = async (req, res) => {
//         const userId = req.userId;
//         const postId = req.params.postId;
//         const body = req.body;
//         const { type, content } = body;

//         try {
//             const newReviewOrComment = await prisma.reviewOrComment.create({
//                 data: {
//                     userId,
//                     postId,
//                     type,
//                     content,
//                 },
//             });
//             res.status(201).json(newReviewOrComment);
//         } catch (error) {
//             console.error(error);
//             res.status(500).json({ error: "Server error" });
//         }
//     };