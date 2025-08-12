import bcrypyt from "bcryptjs";

const plainPassword = "admin";
bcrypyt.hash(plainPassword, 10).then(hash =>{
    console.log(hash);
})