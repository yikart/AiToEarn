/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 * Copyright (C) 2016-2023 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer
 *    in the documentation and/or other materials provided with the
 *    distribution.
 * 3. Neither the name of Google Inc. nor the names of its contributors
 *    may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(MEDIA_STREAM)

#include "RealtimeMediaSourceSupportedConstraints.h"
#include <cstdlib>
#include <wtf/ArgumentCoder.h>
#include <wtf/Function.h>
#include <wtf/Vector.h>

namespace WebCore {
    
class MediaConstraint {
public:
    enum class DataType : uint8_t { Integer, Double, Boolean, String };
    explicit MediaConstraint(DataType dataType)
        : m_dataType(dataType)
    {
    }

    virtual ~MediaConstraint() = default;

    bool isInt() const { return m_dataType == DataType::Integer; }
    bool isDouble() const { return m_dataType == DataType::Double; }
    bool isBoolean() const { return m_dataType == DataType::Boolean; }
    bool isString() const { return m_dataType == DataType::String; }

    DataType dataType() const { return m_dataType; }

    void log(MediaConstraintType) const;

    virtual bool isRequired() const { return false; }

private:
    DataType m_dataType { DataType::Integer };
};

template<class ValueType>
class NumericConstraint : public MediaConstraint {
public:
    void setMin(ValueType value) { m_min = value; }
    void setMax(ValueType value) { m_max = value; }
    void setExact(ValueType value) { m_exact = value; }
    void setIdeal(ValueType value) { m_ideal = value; }

    bool getMin(ValueType& min) const
    {
        if (!m_min)
            return false;

        min = m_min.value();
        return true;
    }

    bool getMax(ValueType& max) const
    {
        if (!m_max)
            return false;

        max = m_max.value();
        return true;
    }

    bool getExact(ValueType& exact) const
    {
        if (!m_exact)
            return false;

        exact = m_exact.value();
        return true;
    }

    bool getIdeal(ValueType& ideal) const
    {
        if (!m_ideal)
            return false;

        ideal = m_ideal.value();
        return true;
    }

    bool nearlyEqual(double a, double b) const
    {
        // Don't require strict equality when comparing constraints, or many floating point constraint values,
        // e.g. "aspectRatio: 1.333", will never match.
        const double epsilon = 0.00001;
        return std::abs(a - b) <= epsilon;
    }

    template<typename RangeType>
    double fitnessDistance(const RangeType& range) const
    {
        return fitnessDistance(range.min(), range.max());
    }

    double fitnessDistance(ValueType rangeMin, ValueType rangeMax) const
    {
        // https://w3c.github.io/mediacapture-main/#dfn-applyconstraints
        // 1. If the constraint is not supported by the browser, the fitness distance is 0.
        if (isEmpty())
            return 0;

        // 2. If the constraint is required ('min', 'max', or 'exact'), and the settings
        //    dictionary's value for the constraint does not satisfy the constraint, the
        //    fitness distance is positive infinity.
        bool valid = validForRange(rangeMin, rangeMax);
        if (m_exact) {
            if (valid && m_min && m_exact.value() < m_min.value())
                valid = false;
            if (valid && m_max && m_exact.value() > m_max.value())
                valid = false;
            if (!valid)
                return std::numeric_limits<double>::infinity();
        }

        if (m_min) {
            if (valid && m_max && m_min.value() > m_max.value())
                valid = false;
            if (!valid)
                return std::numeric_limits<double>::infinity();
        }

        if (m_max) {
            if (valid && m_min && m_max.value() < m_min.value())
                valid = false;
            if (!valid)
                return std::numeric_limits<double>::infinity();
        }

        // 3. If no ideal value is specified, the fitness distance is 0.
        if (!m_ideal)
            return 0;

        // 4. For all positive numeric non-required constraints (such as height, width, frameRate,
        //    aspectRatio, sampleRate and sampleSize), the fitness distance is the result of the formula
        //
        //         (actual == ideal) ? 0 : |actual - ideal| / max(|actual|,|ideal|)
        ValueType ideal = m_ideal.value();
        if (ideal >= rangeMin && ideal <= rangeMax)
            return 0;

        ideal = ideal > std::max(rangeMin, rangeMax) ? rangeMax : rangeMin;
        return static_cast<double>(std::abs(ideal - m_ideal.value())) / std::max(std::abs(ideal), std::abs(m_ideal.value()));
    }

    double fitnessDistance(const Vector<ValueType>& discreteCapabilityValues) const
    {
        double minDistance = std::numeric_limits<double>::infinity();

        for (auto& value : discreteCapabilityValues) {
            auto distance = fitnessDistance(value, value);
            if (distance < minDistance)
                minDistance = distance;
        }

        return minDistance;
    }

    bool validForRange(ValueType rangeMin, ValueType rangeMax) const
    {
        if (isEmpty())
            return false;

        if (m_exact) {
            const ValueType exact = m_exact.value();
            if (exact < rangeMin && !nearlyEqual(exact, rangeMin))
                return false;
            if (exact > rangeMax && !nearlyEqual(exact, rangeMax))
                return false;
        }

        if (m_min) {
            const ValueType constraintMin = m_min.value();
            if (constraintMin > rangeMax && !nearlyEqual(constraintMin, rangeMax))
                return false;
        }

        if (m_max) {
            const ValueType constraintMax = m_max.value();
            if (constraintMax < rangeMin && !nearlyEqual(constraintMax, rangeMin))
                return false;
        }

        return true;
    }

    ValueType find(const Function<bool(ValueType)>& function) const
    {
        if (m_min && function(m_min.value()))
            return m_min.value();

        if (m_max && function(m_max.value()))
            return m_max.value();

        if (m_exact && function(m_exact.value()))
            return m_exact.value();

        if (m_ideal && function(m_ideal.value()))
            return m_ideal.value();

        return 0;
    }

    template<typename RangeType>
    ValueType valueForCapabilityRange(ValueType current, const RangeType& range) const
    {
        return valueForCapabilityRange(current, range.min(), range.max());
    }

    ValueType valueForCapabilityRange(ValueType current, ValueType capabilityMin, ValueType capabilityMax) const
    {
        ValueType value { 0 };
        ValueType min { capabilityMin };
        ValueType max { capabilityMax };

        if (m_exact) {
            ASSERT(validForRange(capabilityMin, capabilityMax));
            return m_exact.value();
        }

        if (m_min) {
            value = m_min.value();
            ASSERT(validForRange(value, capabilityMax));
            if (value > min)
                min = value;
            if (value < min)
                value = min;

            // If there is no ideal, don't change if minimum is smaller than current.
            if (!m_ideal && value < current)
                value = current;
        }

        if (m_max) {
            value = m_max.value();
            ASSERT(validForRange(capabilityMin, value));
            if (value < max)
                max = value;
            if (value > max)
                value = max;
        }

        if (m_ideal)
            value = std::max(min, std::min(max, m_ideal.value()));

        return value;
    }

    std::optional<ValueType> valueForDiscreteCapabilityValues(ValueType current, const Vector<ValueType>& discreteCapabilityValues) const
    {
        std::optional<ValueType> value;
        std::optional<ValueType> min;
        std::optional<ValueType> max;

        if (m_exact) {
            ASSERT(discreteCapabilityValues.contains(m_exact.value()));
            return m_exact.value();
        }

        if (m_min) {
            auto index = discreteCapabilityValues.findIf([&](ValueType value) { return m_min.value() >= value; });
            if (index != notFound) {
                min = value = discreteCapabilityValues[index];

                // If there is no ideal, don't change if minimum is smaller than current.
                if (!m_ideal && *value < current)
                    value = current;
            }
        }

        if (m_max && m_max.value() >= discreteCapabilityValues[0]) {
            for (auto& discreteValue : discreteCapabilityValues) {
                if (m_max.value() <= discreteValue)
                    max = value = discreteValue;
            }
        }

        if (m_ideal && discreteCapabilityValues.contains(m_ideal.value())) {
            value = m_ideal.value();
            if (max)
                value = std::min(max.value(), *value);
            if (min)
                value = std::max(min.value(), *value);
        }

        return value;
    }

    bool isEmpty() const { return !m_min && !m_max && !m_exact && !m_ideal; }
    bool isMandatory() const { return m_min || m_max || m_exact; }

protected:
    NumericConstraint(DataType dataType)
        : MediaConstraint(dataType)
    {
    }
    
    NumericConstraint(MediaConstraint&& mediaConstraint, std::optional<ValueType>&& min, std::optional<ValueType>&& max, std::optional<ValueType>&& exact, std::optional<ValueType>&& ideal)
        : MediaConstraint(WTFMove(mediaConstraint))
        , m_min(WTFMove(min))
        , m_max(WTFMove(max))
        , m_exact(WTFMove(exact))
        , m_ideal(WTFMove(ideal))
    {
    }

    NumericConstraint() = default;

    void innerMerge(const NumericConstraint& other)
    {
        if (other.isEmpty())
            return;

        ValueType value;
        if (other.getExact(value))
            m_exact = value;

        if (other.getMin(value))
            m_min = value;

        if (other.getMax(value))
            m_max = value;

        // https://w3c.github.io/mediacapture-main/#constrainable-interface
        // When processing advanced constraints:
        //   ... the User Agent must attempt to apply, individually, any 'ideal' constraints or
        //   a constraint given as a bare value for the property. Of these properties, it must
        //   satisfy the largest number that it can, in any order.
        if (other.getIdeal(value)) {
            if (!m_ideal || value > m_ideal.value())
                m_ideal = value;
        }
    }

    bool isRequired() const final { return !!m_min || !!m_max || !!m_exact; }

    std::optional<ValueType> m_min;
    std::optional<ValueType> m_max;
    std::optional<ValueType> m_exact;
    std::optional<ValueType> m_ideal;
};

class IntConstraint final : public NumericConstraint<int> {
public:
    IntConstraint()
        : NumericConstraint<int>(DataType::Integer)
    {
    }

    void merge(const IntConstraint& other)
    {
        NumericConstraint::innerMerge(other);
    }

    void logAsInt(MediaConstraintType) const;
    
private:
    friend struct IPC::ArgumentCoder<IntConstraint, void>;
    
    IntConstraint(MediaConstraint&& mediaConstraint, std::optional<int>&& min, std::optional<int>&& max,                   std::optional<int>&& exact, std::optional<int>&& ideal)
        : NumericConstraint<int>(WTFMove(mediaConstraint), WTFMove(min), WTFMove(max), WTFMove(exact), WTFMove(ideal))
    {
    }
};

class DoubleConstraint final : public NumericConstraint<double> {
public:
    DoubleConstraint()
        : NumericConstraint<double>(DataType::Double)
    {
    }

    void merge(const DoubleConstraint& other)
    {
        NumericConstraint::innerMerge(other);
    }

    void logAsDouble(MediaConstraintType) const;
    
private:
    friend struct IPC::ArgumentCoder<DoubleConstraint, void>;
    
    DoubleConstraint(MediaConstraint&& mediaConstraint, std::optional<double>&& min, std::optional<double>&& max,                   std::optional<double>&& exact, std::optional<double>&& ideal)
        : NumericConstraint<double>(WTFMove(mediaConstraint), WTFMove(min), WTFMove(max), WTFMove(exact), WTFMove(ideal))
    {
    }
};

class BooleanConstraint final : public MediaConstraint {
public:
    BooleanConstraint()
        : MediaConstraint(DataType::Boolean)
    {
    }

    void setExact(bool value) { m_exact = value; }
    void setIdeal(bool value) { m_ideal = value; }

    bool getExact(bool& exact) const
    {
        if (!m_exact)
            return false;

        exact = m_exact.value();
        return true;
    }

    bool getIdeal(bool& ideal) const
    {
        if (!m_ideal)
            return false;

        ideal = m_ideal.value();
        return true;
    }

    double fitnessDistance(bool value) const
    {
        // https://w3c.github.io/mediacapture-main/#dfn-applyconstraints
        // 1. If the constraint is not supported by the browser, the fitness distance is 0.
        if (isEmpty())
            return 0;

        // 2. If the constraint is required ('min', 'max', or 'exact'), and the settings
        //    dictionary's value for the constraint does not satisfy the constraint, the
        //    fitness distance is positive infinity.
        if (m_exact && value != m_exact.value())
            return std::numeric_limits<double>::infinity();

        // 3. If no ideal value is specified, the fitness distance is 0.
        if (!m_ideal || m_ideal.value() == value)
            return 0;

        // 5. For all string and enum non-required constraints (deviceId, groupId, facingMode,
        // echoCancellation), the fitness distance is the result of the formula
        //        (actual == ideal) ? 0 : 1
        return 1;
    }

    void merge(const BooleanConstraint& other)
    {
        if (other.isEmpty())
            return;

        bool value;
        if (other.getExact(value))
            m_exact = value;

        if (other.getIdeal(value)) {
            if (!m_ideal || (value && !m_ideal.value()))
                m_ideal = value;
        }
    }

    bool isEmpty() const { return !m_exact && !m_ideal; };
    bool isMandatory() const { return bool(m_exact); }

    void logAsBoolean(MediaConstraintType) const;

private:
    friend struct IPC::ArgumentCoder<BooleanConstraint, void>;
    
    BooleanConstraint(MediaConstraint&& mediaConstraint, std::optional<bool>&& exact, std::optional<bool>&& ideal)
        : MediaConstraint(WTFMove(mediaConstraint))
        , m_exact(WTFMove(exact))
        , m_ideal(WTFMove(ideal))
    {
    }

    bool isRequired() const final { return !!m_exact; }

    std::optional<bool> m_exact;
    std::optional<bool> m_ideal;
};

class StringConstraint : public MediaConstraint {
public:
    StringConstraint()
        : MediaConstraint(DataType::String)
    {
    }

    void setExact(const String& value)
    {
        m_exact.clear();
        m_exact.append(value);
    }

    void appendExact(const String& value)
    {
        m_exact.append(value);
    }

    void setIdeal(const String& value)
    {
        m_ideal.clear();
        m_ideal.append(value);
    }

    void appendIdeal(const String& value)
    {
        m_ideal.append(value);
    }

    bool getExact(Vector<String>& exact) const
    {
        if (m_exact.isEmpty())
            return false;

        exact = m_exact;
        return true;
    }

    bool getIdeal(Vector<String>& ideal) const
    {
        if (m_ideal.isEmpty())
            return false;

        ideal = m_ideal;
        return true;
    }

    double fitnessDistance(const String&) const;
    double fitnessDistance(const Vector<String>&) const;

    const String& find(const Function<bool(const String&)>&) const;

    bool isEmpty() const { return m_exact.isEmpty() && m_ideal.isEmpty(); }
    bool isMandatory() const { return !m_exact.isEmpty(); }
    WEBCORE_EXPORT void merge(const StringConstraint&);

    void removeEmptyStringConstraint()
    {
        m_exact.removeAllMatching([](auto& constraint) {
            return constraint.isEmpty();
        });
        m_ideal.removeAllMatching([](auto& constraint) {
            return constraint.isEmpty();
        });
    }

    StringConstraint isolatedCopy() const;

private:
    friend struct IPC::ArgumentCoder<StringConstraint, void>;
    
    StringConstraint(MediaConstraint&& mediaConstraint, Vector<String>&& exact, Vector<String>&& ideal)
        : MediaConstraint(WTFMove(mediaConstraint))
        , m_exact(WTFMove(exact))
        , m_ideal(WTFMove(ideal))
    {
    }

    bool isRequired() const final { return !m_exact.isEmpty(); }

    Vector<String> m_exact;
    Vector<String> m_ideal;
};

class MediaTrackConstraintSetMap {
public:
    MediaTrackConstraintSetMap() = default;
    MediaTrackConstraintSetMap(std::optional<IntConstraint> width, std::optional<IntConstraint> height, std::optional<IntConstraint> sampleRate, std::optional<IntConstraint> sampleSize, std::optional<DoubleConstraint> aspectRatio, std::optional<DoubleConstraint> frameRate, std::optional<DoubleConstraint> volume, std::optional<BooleanConstraint> echoCancellation, std::optional<BooleanConstraint> displaySurface, std::optional<BooleanConstraint> logicalSurface, std::optional<StringConstraint>&& facingMode, std::optional<StringConstraint>&& deviceId, std::optional<StringConstraint>&& groupId, std::optional<StringConstraint>&& whiteBalanceMode, std::optional<DoubleConstraint> zoom, std::optional<BooleanConstraint> torch, std::optional<BooleanConstraint> backgroundBlur, std::optional<BooleanConstraint> powerEfficient)
        : m_width(width)
        , m_height(height)
        , m_sampleRate(sampleRate)
        , m_sampleSize(sampleSize)
        , m_aspectRatio(aspectRatio)
        , m_frameRate(frameRate)
        , m_volume(volume)
        , m_echoCancellation(echoCancellation)
        , m_displaySurface(displaySurface)
        , m_logicalSurface(logicalSurface)
        , m_facingMode(facingMode)
        , m_deviceId(WTFMove(deviceId))
        , m_groupId(WTFMove(groupId))
        , m_whiteBalanceMode(WTFMove(whiteBalanceMode))
        , m_zoom(zoom)
        , m_torch(torch)
        , m_backgroundBlur(backgroundBlur)
        , m_powerEfficient(powerEfficient)
    {
    }

    WEBCORE_EXPORT void forEach(Function<void(MediaConstraintType, const MediaConstraint&)>&&) const;
    void filter(const Function<bool(MediaConstraintType, const MediaConstraint&)>&) const;
    bool isEmpty() const;
    WEBCORE_EXPORT bool isValid() const;
    WEBCORE_EXPORT size_t size() const;

    WEBCORE_EXPORT void set(MediaConstraintType, std::optional<IntConstraint>&&);
    WEBCORE_EXPORT void set(MediaConstraintType, std::optional<DoubleConstraint>&&);
    WEBCORE_EXPORT void set(MediaConstraintType, std::optional<BooleanConstraint>&&);
    WEBCORE_EXPORT void set(MediaConstraintType, std::optional<StringConstraint>&&);
    void set(MediaConstraintType, const MediaConstraint&);

    void merge(MediaConstraintType, const IntConstraint&);
    void merge(MediaConstraintType, const DoubleConstraint&);
    void merge(MediaConstraintType, const BooleanConstraint&);
    void merge(MediaConstraintType, const StringConstraint&);
    void merge(MediaConstraintType, const MediaConstraint&);

    const std::optional<IntConstraint>& width() const { return m_width; }
    const std::optional<IntConstraint>& height() const { return m_height; }
    const std::optional<IntConstraint>& sampleRate() const { return m_sampleRate; }
    const std::optional<IntConstraint>& sampleSize() const { return m_sampleSize; }

    const std::optional<DoubleConstraint>& aspectRatio() const { return m_aspectRatio; }
    const std::optional<DoubleConstraint>& frameRate() const { return m_frameRate; }
    const std::optional<DoubleConstraint>& volume() const { return m_volume; }

    const std::optional<BooleanConstraint>& echoCancellation() const { return m_echoCancellation; }
    const std::optional<BooleanConstraint>& displaySurface() const { return m_displaySurface; }
    const std::optional<BooleanConstraint>& logicalSurface() const { return m_logicalSurface; }

    const std::optional<StringConstraint>& facingMode() const { return m_facingMode; }
    const std::optional<StringConstraint>& deviceId() const { return m_deviceId; }
    const std::optional<StringConstraint>& groupId() const { return m_groupId; }

    const std::optional<StringConstraint>& whiteBalanceMode() const { return m_whiteBalanceMode; }
    const std::optional<DoubleConstraint>& zoom() const { return m_zoom; }
    const std::optional<BooleanConstraint>& torch() const { return m_torch; }
    const std::optional<BooleanConstraint>& backgroundBlur() const { return m_backgroundBlur; }
    const std::optional<BooleanConstraint>& powerEfficient() const { return m_powerEfficient; }

    MediaTrackConstraintSetMap isolatedCopy() const;

private:
    friend struct IPC::ArgumentCoder<MediaTrackConstraintSetMap, void>;
    std::optional<IntConstraint> m_width;
    std::optional<IntConstraint> m_height;
    std::optional<IntConstraint> m_sampleRate;
    std::optional<IntConstraint> m_sampleSize;

    std::optional<DoubleConstraint> m_aspectRatio;
    std::optional<DoubleConstraint> m_frameRate;
    std::optional<DoubleConstraint> m_volume;

    std::optional<BooleanConstraint> m_echoCancellation;
    std::optional<BooleanConstraint> m_displaySurface;
    std::optional<BooleanConstraint> m_logicalSurface;

    std::optional<StringConstraint> m_facingMode;
    std::optional<StringConstraint> m_deviceId;
    std::optional<StringConstraint> m_groupId;

    std::optional<StringConstraint> m_whiteBalanceMode;
    std::optional<DoubleConstraint> m_zoom;
    std::optional<BooleanConstraint> m_torch;

    std::optional<BooleanConstraint> m_backgroundBlur;
    std::optional<BooleanConstraint> m_powerEfficient;
};

struct MediaConstraints {
    void setDefaultAudioConstraints();
    void setDefaultVideoConstraints();
    bool isConstraintSet(const Function<bool(const MediaTrackConstraintSetMap&)>&);

    MediaTrackConstraintSetMap mandatoryConstraints;
    Vector<MediaTrackConstraintSetMap> advancedConstraints;
    bool isValid { false };

    MediaConstraints isolatedCopy() const;

    enum class DeviceType : bool { Camera, Microphone };
    bool hasDisallowedRequiredConstraintForDeviceSelection(DeviceType) const;
};

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_MEDIACONSTRAINT(ConstraintType, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ConstraintType) \
static bool isType(const WebCore::MediaConstraint& constraint) { return constraint.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()

SPECIALIZE_TYPE_TRAITS_MEDIACONSTRAINT(IntConstraint, isInt())
SPECIALIZE_TYPE_TRAITS_MEDIACONSTRAINT(DoubleConstraint, isDouble())
SPECIALIZE_TYPE_TRAITS_MEDIACONSTRAINT(StringConstraint, isString())
SPECIALIZE_TYPE_TRAITS_MEDIACONSTRAINT(BooleanConstraint, isBoolean())

#endif // ENABLE(MEDIA_STREAM)
