import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
    cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
    api_key: process.env['CLOUDINARY_API_KEY'],
    api_secret: process.env['CLOUDINARY_API_SECRET'],
})

export async function uploadLetterImage(
    fileBuffer: Buffer,
    userId: string,
): Promise<string> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                {
                    folder: `2u/letters/${userId}`,
                    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
                    resource_type: 'auto',
                },
                (error, result) => {
                    if (error || !result) return reject(error)
                    resolve(result.secure_url)
                },
            )
            .end(fileBuffer)
    })
}

export default cloudinary
