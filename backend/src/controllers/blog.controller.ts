import { Request, Response } from 'express';
import { Blog } from '../models/Blog';

export const getAllBlogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find()
      .select('-content -_id -__v') // expose only public blog metadata
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments();

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching blogs' });
  }
};

export const getBlogBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug }).select('-_id -__v');

    if (!blog) {
      res.status(404).json({ success: false, message: 'Blog not found' });
      return;
    }

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    res.status(500).json({ success: false, message: 'Server error fetching blog' });
  }
};

export const getRelatedBlogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    
    // Fetch 3 random blogs excluding the current one
    const relatedBlogs = await Blog.aggregate([
      { $match: { slug: { $ne: slug } } },
      { $sample: { size: 3 } },
      { $project: { content: 0, _id: 0, __v: 0 } } // Exclude internal fields and full content
    ]);

    res.status(200).json({ success: true, data: relatedBlogs });
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching related blogs' });
  }
};
