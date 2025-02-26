/*
 * Copyright (C) 2016-2019 Apple Inc. All rights reserved.
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

#include "SVGAngleValue.h"
#include "SVGValueProperty.h"

namespace WebCore {

class SVGAngle : public SVGValueProperty<SVGAngleValue> {
    using Base = SVGValueProperty<SVGAngleValue>;
    using Base::Base;
    using Base::m_value;

public:
    static Ref<SVGAngle> create(const SVGAngleValue& value = { })
    {
        return adoptRef(*new SVGAngle(value));
    }

    static Ref<SVGAngle> create(SVGPropertyOwner* owner, SVGPropertyAccess access, const SVGAngleValue& value = { })
    {
        return adoptRef(*new SVGAngle(owner, access, value));
    }

    template<typename T>
    static ExceptionOr<Ref<SVGAngle>> create(ExceptionOr<T>&& value)
    {
        if (value.hasException())
            return value.releaseException();
        return adoptRef(*new SVGAngle(value.releaseReturnValue()));
    }

    SVGAngleValue::Type unitType() const
    {
        // Per spec https://svgwg.org/svg2-draft/types.html#__svg__SVGAngle__SVG_ANGLETYPE_UNKNOWN
        if (m_value.unitType() > SVGAngleValue::Type::SVG_ANGLETYPE_GRAD)
            return SVGAngleValue::Type::SVG_ANGLETYPE_UNKNOWN;
        return m_value.unitType();
    }

    ExceptionOr<void> setValueForBindings(float value)
    {
        if (isReadOnly())
            return Exception { ExceptionCode::NoModificationAllowedError };

        m_value.setValue(value);
        commitChange();
        return { };
    }
    
    float valueForBindings() const
    {
        return m_value.value();
    }

    ExceptionOr<void> setValueInSpecifiedUnits(float valueInSpecifiedUnits)
    {
        if (isReadOnly())
            return Exception { ExceptionCode::NoModificationAllowedError };

        m_value.setValueInSpecifiedUnits(valueInSpecifiedUnits);
        commitChange();
        return { };
    }
    
    float valueInSpecifiedUnits() const
    {
        return m_value.valueInSpecifiedUnits();
    }

    ExceptionOr<void> setValueAsString(const String& value)
    {
        if (isReadOnly())
            return Exception { ExceptionCode::NoModificationAllowedError };

        auto result = m_value.setValueAsString(value);
        if (result.hasException())
            return result;
        
        commitChange();
        return result;
    }

    String valueAsString() const override
    {
        return m_value.valueAsString();
    }

    ExceptionOr<void> newValueSpecifiedUnits(unsigned short unitType, float valueInSpecifiedUnits)
    {
        if (isReadOnly())
            return Exception { ExceptionCode::NoModificationAllowedError };

        auto result = m_value.newValueSpecifiedUnits(unitType, valueInSpecifiedUnits);
        if (result.hasException())
            return result;
        
        commitChange();
        return result;
    }
    
    ExceptionOr<void> convertToSpecifiedUnits(unsigned short unitType)
    {
        if (isReadOnly())
            return Exception { ExceptionCode::NoModificationAllowedError };

        auto result = m_value.convertToSpecifiedUnits(unitType);
        if (result.hasException())
            return result;
        
        commitChange();
        return result;
    }
};

} // namespace WebCore
