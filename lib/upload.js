import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebase";

const upload  = async (file, fileType) => {
    const date = new Date();
    let storageRef;
    if (fileType === 'image') {
        storageRef = ref(storage, `images/${date + file.name}`);
    } else if (fileType === 'audio') {
        storageRef = ref(storage, `audio/${date + file.name}`);
    } else {
        // Handle other file types if necessary
        return Promise.reject('Invalid file type');
    }

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            }, 
            (error) => {
                reject("Something went wrong!" + error.code);
            }, 
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL);
                });
            }
        );
    });
}

export default upload;
