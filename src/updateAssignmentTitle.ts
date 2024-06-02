import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion } from "./notion";
import { throttle } from "./throttle";

const ASSESSMENT_ID = "w|?L";

export const updateAssignmentTitle = async (page: PageObjectResponse) => {
	const typeProperty = page.properties.Type;
	const moduleProperty = page.properties.Module;
	const assignmentNumberProperty = page.properties["Assignment Number"];

	if (typeProperty.type !== "select") {
		throw new Error("Type property is not a select property");
	}

	if (typeProperty.select?.id !== ASSESSMENT_ID) {
		console.log(`${page.id} not an assessment, skipping`);
		return;
	}

	if (moduleProperty.type !== "select") {
		throw new Error("Module property is not a select property");
	}

	const moduleCode = moduleProperty.select?.name;

	if (typeof moduleCode !== "string") {
		console.log(`${page.id} does not have a module code, skipping`);
		return;
	}

	if (assignmentNumberProperty.type !== "number") {
		throw new Error("Assignment Number property is not a number property");
	}

	const assignmentNumber = assignmentNumberProperty.number;

	if (typeof assignmentNumber !== "number") {
		console.log(`${page.id} does not have an assignment number, skipping`);
		return;
	}

	const title = `AS${assignmentNumber} | ${moduleCode}`;

	console.log(`Updating ${page.id} title to ${title}`);

	await throttle(() =>
		notion.pages.update({
			page_id: page.id,
			properties: {
				Name: {
					title: [
						{
							text: {
								content: title,
							},
						},
					],
				},
			},
			icon: { type: "emoji", emoji: "🎯" },
		}),
	)();
};
