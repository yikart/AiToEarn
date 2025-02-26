/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/HashMap.h>
#include <wtf/Hasher.h>
#include <wtf/text/StringHash.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

using FontFeatureValuesTag = std::pair<String, Vector<unsigned>>;

enum class FontFeatureValuesType {
    Styleset,
    Stylistic,
    CharacterVariant,
    Swash,
    Ornaments,
    Annotation
};

class FontFeatureValues : public RefCounted<FontFeatureValues> {
public:
    using Tags = UncheckedKeyHashMap<String, Vector<unsigned>>;
    static Ref<FontFeatureValues> create() { return adoptRef(*new FontFeatureValues()); }
    virtual ~FontFeatureValues() = default;

    bool isEmpty() const
    {
        return m_styleset.isEmpty() 
            && m_stylistic.isEmpty() 
            && m_characterVariant.isEmpty() 
            && m_swash.isEmpty()
            && m_ornaments.isEmpty()
            && m_annotation.isEmpty();
    }
    
    bool operator==(const FontFeatureValues& other) const
    {
        return m_styleset == other.styleset()
            && m_stylistic == other.stylistic()
            && m_characterVariant == other.characterVariant()
            && m_swash == other.swash()
            && m_ornaments == other.ornaments()
            && m_annotation == other.annotation();
    }
    
    const Tags& styleset() const
    {
        return m_styleset;
    }

    Tags& styleset()
    {
        return m_styleset;
    }

    const Tags& stylistic() const
    {
        return m_stylistic;
    }

    Tags& stylistic()
    {
        return m_stylistic;
    }

    const Tags& characterVariant() const
    {
        return m_characterVariant;
    }

    Tags& characterVariant()
    {
        return m_characterVariant;
    }

    const Tags& swash() const
    {
        return m_swash;
    }

    Tags& swash()
    {
        return m_swash;
    }

    const Tags& ornaments() const
    {
        return m_ornaments;
    }

    Tags& ornaments()
    {
        return m_ornaments;
    }

    const Tags& annotation() const
    {
        return m_annotation;
    }

    Tags& annotation()
    {
        return m_annotation;
    }

    friend void add(Hasher&, const FontFeatureValues&);
    friend WTF::TextStream& operator<<(WTF::TextStream&, const FontFeatureValues&);
    void updateOrInsert(const FontFeatureValues&);
    void updateOrInsertForType(FontFeatureValuesType, const Vector<FontFeatureValuesTag>&);

private:
    FontFeatureValues() = default;
    Tags m_styleset;
    Tags m_stylistic;
    Tags m_characterVariant;
    Tags m_swash;
    Tags m_ornaments;
    Tags m_annotation;
};

} // namespace WebCore
