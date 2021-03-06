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

import React, {FunctionComponent} from 'react';

import type {CellProps} from 'react-table';
import {Expander} from '~/components/Table';
import {ellipsis} from '~/utils/style';
import styled from 'styled-components';

const Cell = styled.span`
    display: inline-flex;
    align-items: center;
    max-width: 100%;

    > ${Expander} {
        flex: none;
    }

    > .cell {
        flex: auto;
        ${ellipsis()}
    }
`;

const ExpandableCell = <D extends Record<string, unknown>>({
    row,
    cell
}: CellProps<D>): ReturnType<FunctionComponent> => {
    return (
        <Cell>
            <Expander {...row.getToggleRowExpandedProps()} isExpanded={row.isExpanded} />
            <span className="cell" title={cell.value}>
                {cell.value}
            </span>
        </Cell>
    );
};

export default ExpandableCell;
