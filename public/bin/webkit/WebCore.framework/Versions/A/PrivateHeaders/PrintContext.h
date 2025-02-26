/*
 * Copyright (C) 2007 Alp Toker <alp@atoker.com>
 * Copyright (C) 2007 Apple Inc.
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

#include "FrameDestructionObserver.h"
#include "LengthBox.h"
#include <wtf/Forward.h>
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class Document;
class Element;
class FloatRect;
class FloatSize;
class GraphicsContext;
class IntRect;
class LocalFrame;
class Node;

class PrintContext : public FrameDestructionObserver {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(PrintContext, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT explicit PrintContext(LocalFrame*);
    WEBCORE_EXPORT ~PrintContext();

    // Break up a page into rects without relayout.
    // FIXME: This means that CSS page breaks won't be on page boundary if the size is different than what was passed to begin(). That's probably not always desirable.
    // FIXME: Header and footer height should be applied before layout, not after.
    // FIXME: The printRect argument is only used to determine page aspect ratio, it would be better to pass a FloatSize with page dimensions instead.
    WEBCORE_EXPORT void computePageRects(const FloatRect& printRect, float headerHeight, float footerHeight, float userScaleFactor, float& outPageHeight, bool allowHorizontalTiling = false);

    // Deprecated. Page size computation is already in this class, clients shouldn't be copying it.
    WEBCORE_EXPORT void computePageRectsWithPageSize(const FloatSize& pageSizeInPixels, bool allowHorizontalTiling);

    // These are only valid after page rects are computed.
    size_t pageCount() const { return m_pageRects.size(); }
    const IntRect& pageRect(size_t pageNumber) const { return m_pageRects[pageNumber]; }
    const Vector<IntRect>& pageRects() const { return m_pageRects; }
    WEBCORE_EXPORT FloatBoxExtent computedPageMargin(FloatBoxExtent printMargin);
    WEBCORE_EXPORT FloatSize computedPageSize(FloatSize pageSize, FloatBoxExtent printMargin);

    WEBCORE_EXPORT float computeAutomaticScaleFactor(const FloatSize& availablePaperSize);

    // Enter print mode, updating layout for new page size.
    // This function can be called multiple times to apply new print options without going back to screen mode.
    WEBCORE_EXPORT void begin(float width, float height = 0);

    // FIXME: eliminate width argument.
    WEBCORE_EXPORT void spoolPage(GraphicsContext& ctx, int pageNumber, float width);

    WEBCORE_EXPORT void spoolRect(GraphicsContext& ctx, const IntRect&);

    // Return to screen mode.
    WEBCORE_EXPORT void end();

    // Used by layout tests.
    WEBCORE_EXPORT static int pageNumberForElement(Element*, const FloatSize& pageSizeInPixels); // Returns -1 if page isn't found.
    WEBCORE_EXPORT static String pageProperty(LocalFrame*, const char* propertyName, int pageNumber);
    WEBCORE_EXPORT static bool isPageBoxVisible(LocalFrame*, int pageNumber);
    WEBCORE_EXPORT static String pageSizeAndMarginsInPixels(LocalFrame*, int pageNumber, int width, int height, int marginTop, int marginRight, int marginBottom, int marginLeft);
    WEBCORE_EXPORT static int numberOfPages(LocalFrame&, const FloatSize& pageSizeInPixels);
    // Draw all pages into a graphics context with lines which mean page boundaries.
    // The height of the graphics context should be
    // (pageSizeInPixels.height() + 1) * number-of-pages - 1
    WEBCORE_EXPORT static void spoolAllPagesWithBoundaries(LocalFrame&, GraphicsContext&, const FloatSize& pageSizeInPixels);
    
    // By imaging to a width a little wider than the available pixels,
    // thin pages will be scaled down a little, matching the way they
    // print in IE and Camino. This lets them use fewer sheets than they
    // would otherwise, which is presumably why other browsers do this.
    // Wide pages will be scaled down more than this.
    static constexpr float minimumShrinkFactor() { return 1.25; }

    // This number determines how small we are willing to reduce the page content
    // in order to accommodate the widest line. If the page would have to be
    // reduced smaller to make the widest line fit, we just clip instead (this
    // behavior matches MacIE and Mozilla, at least)
    static constexpr float maximumShrinkFactor() { return 2; }

protected:
    Vector<IntRect> m_pageRects;

private:
    void computePageRectsWithPageSizeInternal(const FloatSize& pageSizeInPixels, bool allowHorizontalTiling);
    bool beginAndComputePageRectsWithPageSize(LocalFrame&, const FloatSize& pageSizeInPixels);
    void collectLinkedDestinations(Document&);
    void outputLinkedDestinations(GraphicsContext&, Document&, const IntRect& pageRect);

    // Used to prevent misuses of begin() and end() (e.g., call end without begin).
    bool m_isPrinting { false };

    std::unique_ptr<HashMap<String, Ref<Element>>> m_linkedDestinations;
};

} // namespace WebCore
