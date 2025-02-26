/*
 * Copyright (C) 2006-2020 Apple Inc. All rights reserved.
 * Copyright (C) 2007-2008 Torch Mobile Inc.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "FloatPoint.h"
#include "FloatSize.h"
#include "Glyph.h"
#include "GlyphBufferMembers.h"
#include <climits>
#include <limits>
#include <wtf/CheckedRef.h>
#include <wtf/Vector.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace WebCore {

static const constexpr GlyphBufferGlyph deletedGlyph = 0xFFFF;

class Font;

class GlyphBuffer {
public:
    bool isEmpty() const { return m_fonts.isEmpty(); }
    unsigned size() const { return m_fonts.size(); }
    
    void clear()
    {
        m_fonts.clear();
        m_glyphs.clear();
        m_advances.clear();
        m_origins.clear();
        m_offsetsInString.clear();
    }

    const Font** fonts(unsigned from) { return m_fonts.data() + from; }
    GlyphBufferGlyph* glyphs(unsigned from) { return m_glyphs.data() + from; }
    GlyphBufferAdvance* advances(unsigned from) { return m_advances.data() + from; }
    GlyphBufferOrigin* origins(unsigned from) { return m_origins.data() + from; }
    GlyphBufferStringOffset* offsetsInString(unsigned from) { return m_offsetsInString.data() + from; }
    const Font* const * fonts(unsigned from) const { return m_fonts.data() + from; }
    const GlyphBufferGlyph* glyphs(unsigned from) const { return m_glyphs.data() + from; }
    const GlyphBufferAdvance* advances(unsigned from) const { return m_advances.data() + from; }
    const GlyphBufferOrigin* origins(unsigned from) const { return m_origins.data() + from; }
    const GlyphBufferStringOffset* offsetsInString(unsigned from) const { return m_offsetsInString.data() + from; }

    const Font& fontAt(unsigned index) const
    {
        ASSERT(m_fonts[index]);
        return *m_fonts[index];
    }
    GlyphBufferGlyph glyphAt(unsigned index) const { return m_glyphs[index]; }
    GlyphBufferAdvance advanceAt(unsigned index) const { return m_advances[index]; }
    GlyphBufferOrigin originAt(unsigned index) const { return m_origins[index]; }
    GlyphBufferStringOffset uncheckedStringOffsetAt(unsigned index) const { return m_offsetsInString[index]; }
    std::optional<GlyphBufferStringOffset> checkedStringOffsetAt(unsigned index, unsigned stringLength) const
    {
        auto result = uncheckedStringOffsetAt(index);
        if (static_cast<std::make_unsigned_t<GlyphBufferStringOffset>>(result) >= stringLength)
            return std::nullopt;
        return result;
    }

    void setInitialAdvance(GlyphBufferAdvance initialAdvance) { m_initialAdvance = initialAdvance; }
    const GlyphBufferAdvance& initialAdvance() const { return m_initialAdvance; }
    void expandInitialAdvance(float width) { setWidth(m_initialAdvance, WebCore::width(m_initialAdvance) + width); }
    void expandInitialAdvance(GlyphBufferAdvance additionalAdvance)
    {
        setWidth(m_initialAdvance, width(m_initialAdvance) + width(additionalAdvance));
        setHeight(m_initialAdvance, height(m_initialAdvance) + height(additionalAdvance));
    }
    
    static constexpr GlyphBufferStringOffset noOffset = std::numeric_limits<GlyphBufferStringOffset>::max();
    void add(Glyph glyph, const Font& font, float width, GlyphBufferStringOffset offsetInString = noOffset)
    {
        GlyphBufferAdvance advance = makeGlyphBufferAdvance(width, 0);
        add(glyph, font, advance, offsetInString);
    }

    void add(Glyph glyph, const Font& font, GlyphBufferAdvance advance, GlyphBufferStringOffset offsetInString, FloatPoint origin = { })
    {
        m_fonts.append(&font);
        m_glyphs.append(glyph);
        m_advances.append(advance);
        m_origins.append(makeGlyphBufferOrigin(origin));
        m_offsetsInString.append(offsetInString);
    }

    void remove(unsigned location, unsigned length)
    {
        m_fonts.remove(location, length);
        m_glyphs.remove(location, length);
        m_advances.remove(location, length);
        m_origins.remove(location, length);
        m_offsetsInString.remove(location, length);
    }

    void deleteGlyphWithoutAffectingSize(unsigned index)
    {
        makeGlyphInvisible(index);
        m_advances[index] = makeGlyphBufferAdvance();
    }

    void makeGlyphInvisible(unsigned index)
    {
        // GlyphID 0xFFFF is the "deleted glyph" and is supposed to be invisible when rendered.
        m_glyphs[index] = deletedGlyph;
    }

    void makeHole(unsigned location, unsigned length, const Font* font)
    {
        ASSERT(location <= size());

        m_fonts.insertFill(location, font, length);
        m_glyphs.insertFill(location, std::numeric_limits<GlyphBufferGlyph>::max(), length);
        m_advances.insertFill(location, makeGlyphBufferAdvance(), length);
        m_origins.insertFill(location, makeGlyphBufferOrigin(), length);
        m_offsetsInString.insertFill(location, 0, length);
    }

    void reverse(unsigned from, unsigned length)
    {
        for (unsigned i = from, end = from + length - 1; i < end; ++i, --end)
            swap(i, end);
    }

    void expandLastAdvance(float width)
    {
        ASSERT(!isEmpty());
        GlyphBufferAdvance& lastAdvance = m_advances.last();
        setWidth(lastAdvance, WebCore::width(lastAdvance) + width);
    }

    void expandAdvance(unsigned index, float width)
    {
        ASSERT(index < size());
        auto& lastAdvance = m_advances[index];
        setWidth(lastAdvance, WebCore::width(lastAdvance) + width);
    }

    void expandAdvanceToLogicalRight(unsigned index, float width)
    {
        if (index >= size()) {
            ASSERT_NOT_REACHED();
            return;
        }
        setWidth(m_advances[index], WebCore::width(m_advances[index]) + width);
        setX(m_origins[index], x(m_origins[index]) + width);
    }

    void expandLastAdvance(GlyphBufferAdvance expansion)
    {
        ASSERT(!isEmpty());
        GlyphBufferAdvance& lastAdvance = m_advances.last();
        setWidth(lastAdvance, width(lastAdvance) + width(expansion));
        setHeight(lastAdvance, height(lastAdvance) + height(expansion));
    }

    void shrink(unsigned truncationPoint)
    {
        m_fonts.shrink(truncationPoint);
        m_glyphs.shrink(truncationPoint);
        m_advances.shrink(truncationPoint);
        m_origins.shrink(truncationPoint);
        m_offsetsInString.shrink(truncationPoint);
    }

    /*
     * This is the unflattened format:
     *
     *                                              X (Paint glyph position)   X (Paint glyph position)   X (Paint glyph position)
     *                                             7                          7                          7
     *                                            /                          /                          /
     *                                           / (Origin)                 / (Origin)                 / (Origin)
     *                                          /                          /                          /
     *                                         /                          /                          /
     *                X---------------------->X------------------------->X------------------------->X------------------------->X
     * (text position ^)  (Initial advance)            (Advance)                  (Advance)                   (Advance)
     *
     *
     *
     *
     *
     * And this is what we transform it into:
     *
     *                                        ----->X------------------------->X------------------------->X
     *                                       /               (Advance)                   (Advance)         \
     *                                      /                                                               \
     *                   (Initial advance) /                                                                 \   (Advance)
     *                  -------------------                                                                   ----------------
     *                 /                                                                                                      \
     *                X                                                                                                        X
     * (text position ^)
     *
     * This is an operation that discards all layout information, and preserves only paint information.
     */
    void flatten()
    {
        ASSERT(size() || (!width(m_initialAdvance) && !height(m_initialAdvance)));
        if (size()) {
            m_initialAdvance = makeGlyphBufferAdvance(
                width(m_initialAdvance) + x(m_origins[0]),
                height(m_initialAdvance) + y(m_origins[0]));
        }
        for (unsigned i = 0; i < size(); ++i) {
            m_advances[i] = makeGlyphBufferAdvance(
                -x(m_origins[i]) + width(m_advances[i]) + (i + 1 < size() ? x(m_origins[i + 1]) : 0),
                -y(m_origins[i]) + height(m_advances[i]) + (i + 1 < size() ? y(m_origins[i + 1]) : 0));
            m_origins[i] = makeGlyphBufferOrigin();
        }
    }

#if ASSERT_ENABLED
    bool isFlattened() const
    {
        for (unsigned i = 0; i < size(); ++i) {
            if (x(m_origins[i]) || y(m_origins[i]))
                return false;
        }
        return true;
    }
#endif

private:
    void swap(unsigned index1, unsigned index2)
    {
        auto font = m_fonts[index1];
        m_fonts[index1] = m_fonts[index2];
        m_fonts[index2] = font;

        auto glyph = m_glyphs[index1];
        m_glyphs[index1] = m_glyphs[index2];
        m_glyphs[index2] = glyph;

        auto advance = m_advances[index1];
        m_advances[index1] = m_advances[index2];
        m_advances[index2] = advance;

        auto origin = m_origins[index1];
        m_origins[index1] = m_origins[index2];
        m_origins[index2] = origin;

        auto offset = m_offsetsInString[index1];
        m_offsetsInString[index1] = m_offsetsInString[index2];
        m_offsetsInString[index2] = offset;
    }

    Vector<const Font*, 1024> m_fonts;
    Vector<GlyphBufferGlyph, 1024> m_glyphs;
    Vector<GlyphBufferAdvance, 1024> m_advances;
    Vector<GlyphBufferOrigin, 1024> m_origins;
    Vector<GlyphBufferStringOffset, 1024> m_offsetsInString;
    GlyphBufferAdvance m_initialAdvance { makeGlyphBufferAdvance() };
};

}

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
