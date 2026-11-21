import cloudinary from "../config/cloudinary";

export const uploadToCloudinary = async (filePath: string) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "teenight/products",
    resource_type: "image",
  });

  return {
    image_url: result.secure_url,
    public_id: result.public_id,
  };
};

export const deleteFromCloudinary = async (publicId: string) => {
  const result = await cloudinary.uploader.destroy(publicId);

  return result;
};