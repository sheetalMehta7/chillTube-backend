import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFileOnCloudinary = async (filePath) =>{
    try {
        if(!filePath) return null;

        //upload image on cloudinary
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
        });

        //file uploaded successfully
        console.log(`File uploaded successfully: ${uploadResult.url}`);
        fs.unlinkSync(filePath);
        return uploadResult;

    }catch (error) {
        fs.unlinkSync(filePath);
        console.log(`Error occured while uploading file: ${error}`);
        return null;
    }
}

export { uploadFileOnCloudinary }