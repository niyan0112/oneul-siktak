import { parseDishName } from './mealTransform';

const API_URL = 'https://open.neis.go.kr/hub/mealServiceDietInfo';

export const NEIS_CONFIG = {
  ATPT_OFCDC_SC_CODE: 'K10',
  SD_SCHUL_CODE: 'B000013554',
};

function compactDate(isoDate) {
  return isoDate.replaceAll('-', '');
}

function expandYmd(ymd = '') {
  if (ymd.length !== 8) return '';
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

function getMonthRange(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const firstDate = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0);

  return {
    from: compactDate(`${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}-01`),
    to: compactDate(
      `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`,
    ),
  };
}

function getRowsFromPayload(payload) {
  const body = payload?.mealServiceDietInfo;
  if (!Array.isArray(body)) return [];
  const rowBlock = body.find((item) => Array.isArray(item?.row));
  return rowBlock?.row || [];
}

function normalizeSchoolMealRow(row) {
  return {
    id: `${row.MLSV_YMD}-${row.MMEAL_SC_CODE || row.MMEAL_SC_NM || ''}`,
    date: expandYmd(row.MLSV_YMD),
    ymd: row.MLSV_YMD,
    mealType: row.MMEAL_SC_NM || '',
    menus: parseDishName(row.DDISH_NM || ''),
    dishName: row.DDISH_NM || '',
  };
}

export async function fetchSchoolMealsByMonth(monthKey) {
  const { from, to } = getMonthRange(monthKey);
  const params = new URLSearchParams({
    Type: 'json',
    pIndex: '1',
    pSize: '100',
    ATPT_OFCDC_SC_CODE: NEIS_CONFIG.ATPT_OFCDC_SC_CODE,
    SD_SCHUL_CODE: NEIS_CONFIG.SD_SCHUL_CODE,
    MLSV_FROM_YMD: from,
    MLSV_TO_YMD: to,
  });

  const apiKey = import.meta.env.VITE_NEIS_API_KEY;
  if (apiKey) {
    params.set('KEY', apiKey);
  }

  const response = await fetch(`${API_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`NEIS request failed: ${response.status}`);
  }

  const payload = await response.json();
  return getRowsFromPayload(payload).map(normalizeSchoolMealRow).filter((row) => row.date && row.menus.length > 0);
}

export async function fetchMinjokMealRows(weekDates) {
  const monthKeys = [...new Set(weekDates.map((dateInfo) => dateInfo.iso.slice(0, 7)))];
  const monthRows = (await Promise.all(monthKeys.map(fetchSchoolMealsByMonth))).flat();
  const targetDates = new Set(weekDates.map((dateInfo) => dateInfo.iso));

  return monthRows
    .filter((row) => targetDates.has(row.date))
    .map((row) => ({
      id: row.id,
      sourceSchool: '민족사관고등학교',
      sourceDate: row.date,
      sourceDateLabel: `${Number(row.date.slice(5, 7))}/${Number(row.date.slice(8, 10))}`,
      sourceMealType: row.mealType,
      sourceMenus: row.menus,
    }));
}
