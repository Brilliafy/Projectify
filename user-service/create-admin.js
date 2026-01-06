const { Client } = require("pg");
const bcrypt = require("bcryptjs");

async function createAdmin() {
  const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "userdb",
    user: process.env.DB_USER || "admin",
    password: process.env.DB_PASSWORD || "password123",
  });

  try {
    await client.connect();
    console.log("Connected to database...");

    const email = "admin@projectify.com";
    const password = "admin123"; // Change this to your desired password
    const fullName = "System Administrator";

    const hashedPassword = await bcrypt.hash(password, 10);

    const checkResult = await client.query(
      'SELECT id FROM "User" WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length > 0) {
      console.log(`Admin user with email "${email}" already exists!`);
      console.log("User ID:", checkResult.rows[0].id);
    } else {
      // Insert admin user
      const insertResult = await client.query(
        `INSERT INTO "User" (email, password, "fullName", role, "isActive", "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, email, "fullName", role, "isActive"`,
        [email, hashedPassword, fullName, "ADMIN", true]
      );

      console.log("\nAdmin account created successfully!");
      console.log("--");
      console.log("Email:", insertResult.rows[0].email);
      console.log("Password:", password);
      console.log("Full Name:", insertResult.rows[0].fullName);
      console.log("Role:", insertResult.rows[0].role);
      console.log("Active:", insertResult.rows[0].isActive);
      console.log("--");
      console.log(
        "\nIMPORTANT: Save these credentials and change the password after first login!"
      );
    }

    await client.end();
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
