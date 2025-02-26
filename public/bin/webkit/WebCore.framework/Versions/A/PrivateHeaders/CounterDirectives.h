/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 *
 */

#pragma once

#include <wtf/HashMap.h>
#include <wtf/text/AtomStringHash.h>

namespace WebCore {

struct CounterDirectives {
    std::optional<int> resetValue;
    std::optional<int> incrementValue;
    std::optional<int> setValue;

    friend constexpr bool operator==(const CounterDirectives&, const CounterDirectives&) = default;
};

struct CounterDirectiveMap {
    UncheckedKeyHashMap<AtomString, CounterDirectives> map;

    friend bool operator==(const CounterDirectiveMap&, const CounterDirectiveMap&) = default;
};

} // namespace WebCore
