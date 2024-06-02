import type {
	PageObjectResponse,
	QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { notion } from "./src/notion";
import { throttle } from "./src/throttle";
import { updateAssignmentTitle } from "./src/updateAssignmentTitle";

const DATABASE_ID = process.env.DATABASE_ID;

if (!DATABASE_ID) {
	throw new Error("DATABASE_ID is not set");
}

const UPDATE_INTERVAL = 1000; // 1 second

const prevResultsFile = Bun.file("./result.json");
let prevResult: QueryDatabaseResponse;
if (await prevResultsFile.exists()) {
	prevResult = (await prevResultsFile.json()) as QueryDatabaseResponse;
}

const toPageObjectResponse = (page: unknown) => page as PageObjectResponse;
const isDifferent = (page: PageObjectResponse) => {
	const prevPage = prevResult?.results.find(
		(p) => p.id === page.id,
	) as PageObjectResponse;
	if (!prevPage) {
		return true;
	}

	return JSON.stringify(prevPage) !== JSON.stringify(page);
};

setInterval(async () => {
	console.log("Checking for updates");
	const newResults = await throttle(() =>
		notion.databases.query({
			database_id: DATABASE_ID,
			filter: {
				property: "Type",
				select: {
					equals: "Assessment",
				},
			},
		}),
	)();

	newResults.results
		.map(toPageObjectResponse)
		.filter(isDifferent)
		.forEach(updateAssignmentTitle);

	prevResult = newResults;
	await Bun.write("./result.json", JSON.stringify(newResults));
}, UPDATE_INTERVAL);
