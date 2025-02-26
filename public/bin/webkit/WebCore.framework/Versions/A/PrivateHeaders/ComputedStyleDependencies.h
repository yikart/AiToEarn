/*
 * (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2004-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2024 Samuel Weinig <sam@webkit.org>
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
 */

#pragma once

#include <wtf/Vector.h>

namespace WebCore {

class CSSToLengthConversionData;

enum CSSPropertyID : uint16_t;

struct ComputedStyleDependencies {
    Vector<CSSPropertyID> properties;
    Vector<CSSPropertyID> rootProperties;
    bool containerDimensions { false };
    bool viewportDimensions { false };
    bool anchors { false };

    bool isComputationallyIndependent() const { return properties.isEmpty() && rootProperties.isEmpty() && !containerDimensions && !anchors; }

    // Checks to see if the provided conversion data is sufficient to resolve the provided dependencies.
    bool canResolveDependenciesWithConversionData(const CSSToLengthConversionData&) const;
};

} // namespace WebCore
