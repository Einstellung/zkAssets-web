import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const fileStream = Buffer.from(buffer);

    const pinataForm = new FormData();
    pinataForm.append("file", fileStream, file.name);

    const pinataResponse = await axios.post(
      "https://uploads.pinata.cloud/v3/files",
      pinataForm,
      {
        headers: {
          ...pinataForm.getHeaders(),
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      }
    );

    return NextResponse.json(pinataResponse.data);
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    );
  }
}
