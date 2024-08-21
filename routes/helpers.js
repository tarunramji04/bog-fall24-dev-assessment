import AWS from 'aws-sdk'
import 'dotenv/config'

const bucket = process.env.S3_BUCKET;
const region = process.env.AWS_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

async function uploadToS3(file) {
    try {
        const s3 = new AWS.S3({
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretAccessKey
            }
        });
        const newFileName = file.name + "-" + Date.now().toString();

        const params = {
            Bucket: bucket,
            Key: newFileName,
            Body: file.data
        };
        
        return new Promise((resolve, reject) => {
            s3.upload(params, {}, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data.Key);
                }
            });
        })
        
    } catch(error) {
        console.log(error);
    }
}

export default uploadToS3
