import express from 'express';
import timetable from './timetable.json' assert { type: 'json' };
import { JSDOM } from 'jsdom';
import { config } from 'dotenv';

config();

const app = express();

app.use(express.json());

let { CACHE_TIME, PORT } = process.env;

let lastRetrivedLessons = Date.now();
let lessons: { subject: string; teacher: string; class: string }[];

app.get('/', async (req, res) => {
	res.send(await getLessons());
});

app.get('/debug/refreshCache', async (req, res) => {
	lessons = undefined;
	res.send(await getLessons());
});

app.get('/debug/getInfo', async (req, res) => {
	res.send({
		day: getDay(),
		week: await getWeek(),
	});
});

app.listen(parseInt(PORT));

async function getLessons() {
	const timeSinceLastCheck = Date.now() - lastRetrivedLessons;
	if (timeSinceLastCheck < parseInt(CACHE_TIME) && lessons) return lessons;

	const week = await getWeek();

	const day = getDay();

	lastRetrivedLessons = Date.now();
	lessons = timetable[week][day];
	return lessons;
}

function getDay() {
	return new Date().getDay() - 1;
}

async function getWeek() {
	const webdata = await fetch('https://www.stjuliansschool.co.uk/');

	const dom = new JSDOM(await webdata.text());

	const week =
		dom.window.document.querySelector('.week>.active').textContent === 'Week 1'
			? 0
			: 1;

	return week;
}
