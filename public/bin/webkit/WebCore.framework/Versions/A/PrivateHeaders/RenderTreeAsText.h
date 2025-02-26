/*
 * Copyright (C) 2003, 2006, 2008 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/Forward.h>
#include <wtf/OptionSet.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class Element;
class LocalFrame;
class RenderObject;
class RenderView;

enum class RenderAsTextFlag : uint16_t {
    ShowAllLayers           = 1 << 0, // Dump all layers, not just those that would paint.
    ShowLayerNesting        = 1 << 1, // Annotate the layer lists.
    ShowCompositedLayers    = 1 << 2, // Show which layers are composited.
    ShowOverflow            = 1 << 3, // Print layout and visual overflow.
    ShowSVGGeometry         = 1 << 4, // Print additional geometry for SVG objects.
    ShowLayerFragments      = 1 << 5, // Print additional info about fragmented RenderLayers
    ShowAddresses           = 1 << 6, // Show layer and renderer addresses.
    ShowIDAndClass          = 1 << 7, // Show id and class attributes
    PrintingMode            = 1 << 8, // Dump the tree in printing mode.
    DontUpdateLayout        = 1 << 9, // Don't update layout, to make it safe to call showLayerTree() from the debugger inside layout or painting code.
    ShowLayoutState         = 1 << 10, // Print the various 'needs layout' bits on renderers.
};

// You don't need pageWidthInPixels if you don't specify RenderAsTextInPrintingMode.
WEBCORE_EXPORT TextStream createTextStream(const RenderView&);
WEBCORE_EXPORT String externalRepresentation(LocalFrame*, OptionSet<RenderAsTextFlag> = { });
WEBCORE_EXPORT String externalRepresentation(Element*, OptionSet<RenderAsTextFlag> = { });
WEBCORE_EXPORT void externalRepresentationForLocalFrame(TextStream&, LocalFrame&, OptionSet<RenderAsTextFlag> = { });
void write(WTF::TextStream&, const RenderObject&, OptionSet<RenderAsTextFlag> = { });
void writeDebugInfo(WTF::TextStream&, const RenderObject&, OptionSet<RenderAsTextFlag> = { });

class RenderTreeAsText {
// FIXME: This is a cheesy hack to allow easy access to RenderStyle colors.  It won't be needed if we convert
// it to use visitedDependentColor instead. (This just involves rebaselining many results though, so for now it's
// not being done).
public:
    static void writeRenderObject(WTF::TextStream&, const RenderObject&, OptionSet<RenderAsTextFlag>);
};

// Helper function shared with SVGRenderTreeAsText
String quoteAndEscapeNonPrintables(StringView);

WEBCORE_EXPORT String counterValueForElement(Element*);
WEBCORE_EXPORT String markerTextForListItem(Element*);

} // namespace WebCore
