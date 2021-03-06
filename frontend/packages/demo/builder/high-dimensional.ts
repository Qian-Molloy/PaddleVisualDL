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

import type {Worker} from './types';

interface Embedding {
    name: string;
    shape: [number, number];
    path: string;
}

const worker: Worker = async io => {
    const list = await io.save<Embedding[]>('/embedding/list');
    await Promise.all(
        list.map(({name}) =>
            Promise.all([io.saveBinary('/embedding/tensor', {name}), io.saveBinary('/embedding/metadata', {name})])
        )
    );
};

export default worker;
