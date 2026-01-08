"use server";
// import { neon } from "@neondatabase/serverless";

export async function getData() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not defined");
    }
    // const sql = neon(process.env.DATABASE_URL);
    // Example query - replace with actual query needed
    // const data = await sql`SELECT version()`;
    // return data;
    return { message: "Connected to Neon" };
}
