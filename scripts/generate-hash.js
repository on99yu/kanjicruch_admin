import bcrypt from "bcryptjs";

const plainPassword = process.env.ADMIN_PASSWORD;

if (!plainPassword) {
  console.error("ADMIN_PASSWORD 환경변수를 입력하세요.");
  process.exit(1);
}

bcrypt.hash(plainPassword, 12).then((hash) => {
  console.log(hash);
});
