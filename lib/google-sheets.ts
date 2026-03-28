import { google } from "googleapis";

import type { PlayerRecord } from "@/lib/types";

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google service account credentials are missing.");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function getSheetId(): string {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID is missing.");
  }

  return sheetId;
}

export async function getExistingIgns(): Promise<string[]> {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: "A:A",
  });

  const rows = response.data.values ?? [];
  return rows
    .flat()
    .map((value) => String(value).trim())
    .filter(Boolean);
}

export async function appendRegistration(record: PlayerRecord): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: "A:F",
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          record.ign,
          record.friendCode,
          record.contactLink,
          record.contactMethod,
          record.tags.join(", "),
          record.createdAt ?? new Date().toISOString(),
        ],
      ],
    },
  });
}
