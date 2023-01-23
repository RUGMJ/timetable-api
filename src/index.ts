import express from 'express';
import timetable from './timetable.json' assert { type: 'json' };
import { JSDOM } from 'jsdom';
import { config } from 'dotenv';

config();

const app = express();

app.use(express.json());

let { CACHE_TIME, PORT } = process.env;

let lastRetrivedWeek = Date.now();
let week: number;

app.get('/', async (req, res) => {
	res.send(await getLessons());
});

app.get('/tomorrow', async (req, res) => {
	res.send(await getLessons(1));
});

app.get('/debug/refreshCache', async (req, res) => {
	week = undefined;
	res.send(await getLessons());
});

app.get('/debug/getInfo', async (req, res) => {
	res.send({
		day: getDay(),
		week: await getWeek(),
	});
});

app.listen(parseInt(PORT));

async function getLessons(dayOffset = 0) {
	const week = await getWeek();

	const day = getDay() + dayOffset;

	return timetable[week][day];
}

function getDay() {
	return new Date().getDay() - 1;
}

async function getWeek() {
	const timeSinceLastCheck = Date.now() - lastRetrivedWeek;
	if (timeSinceLastCheck < parseInt(CACHE_TIME) && week) return week;

	const webdata = await fetch('https://www.stjuliansschool.co.uk/');

	const dom = new JSDOM(await webdata.text());

	week =
		dom.window.document.querySelector('.week>.active').textContent === 'Week 1'
			? 0
			: 1;

	return week;
}
