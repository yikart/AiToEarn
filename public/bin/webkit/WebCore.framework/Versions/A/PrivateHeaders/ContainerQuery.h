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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "GenericMediaQueryTypes.h"
#include <wtf/Forward.h>
#include <wtf/OptionSet.h>
#include <wtf/text/AtomString.h>

namespace WebCore {

class CSSValue;
class Element;

namespace CQ {

namespace FeatureSchemas {
const MQ::FeatureSchema& width();
const MQ::FeatureSchema& height();
const MQ::FeatureSchema& inlineSize();
const MQ::FeatureSchema& blockSize();
const MQ::FeatureSchema& aspectRatio();
const MQ::FeatureSchema& orientation();
};

enum class Axis : uint8_t {
    Block   = 1 << 0,
    Inline  = 1 << 1,
    Width   = 1 << 2,
    Height  = 1 << 3,
};
OptionSet<Axis> requiredAxesForFeature(const MQ::Feature&);

enum class ContainsUnknownFeature : bool { No, Yes };

struct ContainerQuery {
    AtomString name;
    MQ::Condition condition;
    OptionSet<CQ::Axis> requiredAxes;
    ContainsUnknownFeature containsUnknownFeature;
};

void serialize(StringBuilder&, const ContainerQuery&);

}

}
