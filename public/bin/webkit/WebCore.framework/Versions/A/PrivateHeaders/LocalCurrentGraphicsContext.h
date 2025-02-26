/*
 * Copyright (C) 2006-2020 Apple Inc.
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

#include "CGContextStateSaver.h"
#include "GraphicsContextCG.h"
#include "GraphicsContextStateSaver.h"
#include <wtf/Noncopyable.h>

#if PLATFORM(COCOA)

#if USE(APPKIT)
OBJC_CLASS NSGraphicsContext;
#endif

namespace WebCore {

// Scoped setter for the current NSGraphicsContext for functions which call out into AppKit and rely on the
// currentContext being set.
class LocalCurrentContextSaver {
    WTF_MAKE_NONCOPYABLE(LocalCurrentContextSaver);
public:
    WEBCORE_EXPORT LocalCurrentContextSaver(CGContextRef, bool isFlipped = true);
    WEBCORE_EXPORT ~LocalCurrentContextSaver();

private:
#if USE(APPKIT)
    RetainPtr<NSGraphicsContext> m_savedNSGraphicsContext;
#endif
    bool m_didSetGraphicsContext { false };
};

// Scoped setter for the current NSGraphicsContext for functions which call out into AppKit and rely on the
// currentContext being set.
// Preserves the CGContext state.
class LocalCurrentCGContext {
    WTF_MAKE_NONCOPYABLE(LocalCurrentCGContext);
public:
    LocalCurrentCGContext(CGContextRef context)
        : m_stateSaver(context)
        , m_globalSaver(context)
    {
    }

    ~LocalCurrentCGContext() = default;

private:
    CGContextStateSaver m_stateSaver;
    LocalCurrentContextSaver m_globalSaver;
};

// Scoped setter for the current NSGraphicsContext for functions which call out into AppKit and rely on the
// currentContext being set.
// Preserves the GraphicsContext state.
class LocalCurrentGraphicsContext {
    WTF_MAKE_NONCOPYABLE(LocalCurrentGraphicsContext);
public:
    LocalCurrentGraphicsContext(GraphicsContext& context, bool isFlipped = true)
        : m_stateSaver(context)
        , m_globalSaver(context.platformContext(), isFlipped)
    {
    }

    ~LocalCurrentGraphicsContext() = default;

    CGContextRef cgContext() { return m_stateSaver.context()->platformContext(); }

private:
    GraphicsContextStateSaver m_stateSaver;
    LocalCurrentContextSaver m_globalSaver;
};

}

#endif // PLATFORM(COCOA)
