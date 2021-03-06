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

// cSpell:words quantile

import BigNumber from 'bignumber.js';
import moment from 'moment';

export const formatTime = (value: number, language: string, formatter = 'L LTS') =>
    moment(Math.floor(value), 'x').locale(language).format(formatter);

export const humanizeDuration = (ms: number) => {
    const time = moment.duration(ms);
    const hour = Math.floor(time.asHours());
    if (hour) {
        time.subtract(hour, 'hour');
    }
    const minute = time.minutes();
    if (minute) {
        time.subtract(minute, 'minute');
    }
    const second = Math.floor(time.seconds());
    let str = `${second}s`;
    if (hour) {
        str = `${hour}h${minute}m${str}`;
    } else if (minute) {
        str = `${minute}m${str}`;
    }
    return str;
};

export const quantile = (values: number[], p: number) => {
    const n = values.length;
    if (!n) {
        return NaN;
    }
    if ((p = +p) <= 0 || n < 2) {
        return values[0];
    }
    if (p >= 1) {
        return values[n - 1];
    }
    const i = new BigNumber(p).multipliedBy(n - 1);
    const i0 = i.integerValue().toNumber();
    const value0 = new BigNumber(values[i0]);
    const value1 = new BigNumber(values[i0 + 1]);
    return value0.plus(value1.minus(value0).multipliedBy(i.minus(i0))).toNumber();
};

export const distance = (p1: [number, number], p2: [number, number]): number =>
    Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);

export const safeSplit = (s: string, d: string) => (s.length ? s.split(d) : []);
