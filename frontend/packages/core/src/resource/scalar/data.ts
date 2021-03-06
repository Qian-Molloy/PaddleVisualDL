/**
 * Copyright 2020 Baidu Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// cSpell:words quantile accum debias exponentiated

import type {Dataset, ScalarDataset, Value} from './types';

import BigNumber from 'bignumber.js';
import type {Run} from '~/types';
import compact from 'lodash/compact';
import maxBy from 'lodash/maxBy';
import minBy from 'lodash/minBy';
import {quantile} from '~/utils';

export const transform = ({datasets, smoothing}: {datasets: ScalarDataset[]; smoothing: number}) =>
    // https://en.wikipedia.org/wiki/Moving_average
    datasets.map(seriesData => {
        const data = seriesData.map<Dataset[number]>(s => [
            s[0],
            s[1],
            Number.isFinite(s[2]) ? (s[2] as number) : null,
            Number.NaN,
            Number.NaN
        ]);
        let last = new BigNumber(data.length > 0 ? 0 : Number.NaN);
        let numAccum = 0;
        let startValue = 0;
        const bigSmoothing = new BigNumber(smoothing);
        data.forEach((d, i) => {
            const millisecond = (d[0] = Math.floor(d[0]));
            if (i === 0) {
                startValue = millisecond;
            }
            // relative time in millisecond.
            d[4] = Math.floor(millisecond - startValue);
            if (!Number.isFinite(d[2])) {
                d[3] = null;
            } else {
                const nextVal = new BigNumber(d[2] as number);
                if (!nextVal.isFinite()) {
                    d[3] = nextVal.toNumber();
                } else {
                    // last = last * smoothing + (1 - smoothing) * nextVal;
                    last = last.multipliedBy(bigSmoothing).plus(bigSmoothing.minus(1).negated().multipliedBy(nextVal));
                    numAccum++;
                    let debiasWeight = new BigNumber(1);
                    if (!bigSmoothing.isEqualTo(1)) {
                        //debiasWeight = 1.0 - Math.pow(smoothing, numAccum);
                        debiasWeight = bigSmoothing.exponentiatedBy(numAccum).minus(1).negated();
                    }
                    // d[3] = last / debiasWeight;
                    d[3] = last.dividedBy(debiasWeight).toNumber();
                }
            }
        });
        return data;
    });

export const singlePointRange = (value: Value) => ({
    min: Number.isFinite(value) ? Math.min((value as number) * 2, 0) : -0.5,
    max: Number.isFinite(value) ? Math.max((value as number) * 2, 0) : 0.5
});

export const range = ({datasets}: {datasets: Dataset[]}) => {
    return datasets?.map(dataset => {
        if (dataset.length == 0) {
            return {
                min: Number.NaN,
                max: Number.NaN
            };
        }
        const values = dataset.map(v => v[2]).filter(Number.isFinite) as number[];
        return {
            min: Math.min(...values) ?? Number.NaN,
            max: Math.max(...values) ?? Number.NaN
        };
    });
};

export const axisRange = ({datasets, outlier}: {datasets: Dataset[]; outlier: boolean}) => {
    const ranges = compact(
        datasets?.map(dataset => {
            if (dataset.length === 0) {
                return void 0;
            }
            const values = dataset.map(v => v[2]).filter(Number.isFinite) as number[];
            if (!outlier) {
                // Get the origin data range.
                return {
                    min: Math.min(...values) ?? 0,
                    max: Math.max(...values) ?? 0
                };
            } else {
                // Get the quantile range.
                const sorted = dataset
                    .map(v => v[2])
                    .filter(Number.isFinite)
                    .sort() as number[];
                return {
                    min: quantile(sorted, 0.05),
                    max: quantile(values, 0.95)
                };
            }
        })
    );

    const min = minBy(ranges, range => range.min)?.min ?? 0;
    const max = maxBy(ranges, range => range.max)?.max ?? 0;

    if (!(min === 0 && max === 0)) {
        return {
            min: min > 0 ? min * 0.9 : min * 1.1,
            max: max > 0 ? max * 1.1 : max * 0.9
        };
    }
};

export const nearestPoint = (data: Dataset[], rawItem: ScalarDataset[], runs: Run[], idx: number, value: number) => {
    const result: {run: Run; item: Dataset[number]; rawItem: ScalarDataset[number]}[] = [];
    data.forEach((series, index) => {
        const run = runs[index];
        let d = Number.POSITIVE_INFINITY;
        let dv = value;
        for (let i = 0; i < series.length; i++) {
            const v = series[i][idx];
            if (Number.isFinite(v)) {
                const dd = Math.abs((v as number) - value);
                if (d > dd) {
                    d = dd;
                    dv = v as number;
                }
            }
        }
        result.push(
            ...series.reduce<typeof result>((m, c, i) => {
                if (c[idx] === dv) {
                    m.push({
                        run,
                        item: c,
                        rawItem: rawItem[index][i]
                    });
                }
                return m;
            }, [])
        );
    });
    return result;
};

export const parseSmoothing = (value: unknown) => {
    const parsedValue = Number.parseFloat(String(value));
    let smoothing = 0.6;
    if (Number.isFinite(parsedValue) && parsedValue < 1 && parsedValue >= 0) {
        smoothing = Math.round(parsedValue * 100) / 100;
    }
    return smoothing;
};
