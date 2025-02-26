/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2001 Dirk Mueller (mueller@kde.org)
 *           (C) 2006 Alexey Proskuryakov (ap@webkit.org)
 * Copyright (C) 2004, 2005, 2006, 2007, 2008 Apple Inc. All rights reserved.
 * Copyright (C) 2008 Torch Mobile Inc. All rights reserved. (http://www.torchmobile.com/)
 * Copyright (C) 2010 Nokia Corporation and/or its subsidiary(-ies)
 * Copyright (C) 2012 Intel Corporation. All rights reserved.
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

#include "FloatSize.h"
#include <wtf/Forward.h>

namespace WebCore {

class Document;

enum class ViewportErrorCode : uint8_t {
    UnrecognizedViewportArgumentKey,
    UnrecognizedViewportArgumentValue,
    TruncatedViewportArgumentValue,
    MaximumScaleTooLarge,
};

enum class ViewportFit : uint8_t {
    Auto,
    Contain,
    Cover
};

struct ViewportAttributes {
    FloatSize layoutSize;

    float initialScale;
    float minimumScale;
    float maximumScale;

    float userScalable;
    float orientation;
    float shrinkToFit;

    ViewportFit viewportFit;
};

struct ViewportArguments {

    enum class Type : uint8_t {
        // These are ordered in increasing importance.
        Implicit,
#if PLATFORM(IOS_FAMILY)
        PluginDocument,
        ImageDocument,
#endif
        ViewportMeta,
    } type;

    static constexpr int ValueAuto = -1;
    static constexpr int ValueDeviceWidth = -2;
    static constexpr int ValueDeviceHeight = -3;
    static constexpr int ValuePortrait = -4;
    static constexpr int ValueLandscape = -5;

    explicit ViewportArguments(Type type = Type::Implicit)
        : type(type)
    {
    }

    ViewportArguments(Type type, float width, float height, float zoom, float minZoom, float maxZoom, float userZoom, float orientation, float shrinkToFit, ViewportFit viewportFit, bool widthWasExplicit)
        : type(type)
        , width(width)
        , height(height)
        , zoom(zoom)
        , minZoom(minZoom)
        , maxZoom(maxZoom)
        , userZoom(userZoom)
        , orientation(orientation)
        , shrinkToFit(shrinkToFit)
        , viewportFit(viewportFit)
        , widthWasExplicit(widthWasExplicit)
    {
    }

    // All arguments are in CSS units.
    ViewportAttributes resolve(const FloatSize& initialViewportSize, const FloatSize& deviceSize, int defaultWidth) const;

    float width { ValueAuto };
    float height { ValueAuto };
    float zoom { ValueAuto };
    float minZoom { ValueAuto };
    float maxZoom { ValueAuto };
    float userZoom { ValueAuto };
    float orientation { ValueAuto };
    float shrinkToFit { ValueAuto };
    ViewportFit viewportFit { ViewportFit::Auto };
    bool widthWasExplicit { false };

    bool operator==(const ViewportArguments& other) const
    {
        // Used for figuring out whether to reset the viewport or not,
        // thus we are not taking type into account.
        return width == other.width
            && height == other.height
            && zoom == other.zoom
            && minZoom == other.minZoom
            && maxZoom == other.maxZoom
            && userZoom == other.userZoom
            && orientation == other.orientation
            && shrinkToFit == other.shrinkToFit
            && viewportFit == other.viewportFit
            && widthWasExplicit == other.widthWasExplicit;
    }

#if PLATFORM(GTK)
    // FIXME: We're going to keep this constant around until all embedders
    // refactor their code to no longer need it.
    static const float deprecatedTargetDPI;
#endif
};

WEBCORE_EXPORT ViewportAttributes computeViewportAttributes(ViewportArguments args, int desktopWidth, int deviceWidth, int deviceHeight, float devicePixelRatio, IntSize visibleViewport);

WEBCORE_EXPORT void restrictMinimumScaleFactorToViewportSize(ViewportAttributes& result, IntSize visibleViewport, float devicePixelRatio);
WEBCORE_EXPORT void restrictScaleFactorToInitialScaleIfNotUserScalable(ViewportAttributes& result);
WEBCORE_EXPORT float computeMinimumScaleFactorForContentContained(const ViewportAttributes& result, const IntSize& viewportSize, const IntSize& contentSize);

typedef Function<void(ViewportErrorCode, const String&)> ViewportErrorHandler;
void setViewportFeature(ViewportArguments&, Document&, StringView key, StringView value);
WEBCORE_EXPORT void setViewportFeature(ViewportArguments&, StringView key, StringView value, const ViewportErrorHandler&);

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const ViewportArguments&);

} // namespace WebCore
