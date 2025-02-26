/*
 * Copyright 2005 Frerich Raabe <raabe@kde.org>
 * Copyright (C) 2006-2024 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "XPathNodeSet.h"

namespace WebCore {
namespace XPath {

class Value {
public:
    enum class Type : uint8_t { NodeSet, Boolean, Number, String };

    Value() = delete;

    Value(bool value)
        : m_type(Type::Boolean), m_bool(value)
    { }
    Value(unsigned value)
        : m_type(Type::Number), m_number(value)
    { }
    Value(double value)
        : m_type(Type::Number), m_number(value)
    { }

    Value(const String& value)
        : m_type(Type::String), m_data(Data::create(value))
    { }
    Value(const char* value)
        : m_type(Type::String), m_data(Data::create(String::fromLatin1(value)))
    { }

    explicit Value(NodeSet&& value)
        : m_type(Type::NodeSet), m_data(Data::create(WTFMove(value)))
    { }
    explicit Value(Node* value)
        : m_type(Type::NodeSet), m_data(Data::create(value))
    { }
    explicit Value(RefPtr<Node>&& value)
        : m_type(Type::NodeSet), m_data(Data::create(WTFMove(value)))
    { }

    Type type() const { return m_type; }

    bool isNodeSet() const { return m_type == Type::NodeSet; }
    bool isBoolean() const { return m_type == Type::Boolean; }
    bool isNumber() const { return m_type == Type::Number; }
    bool isString() const { return m_type == Type::String; }

    const NodeSet& toNodeSet() const;
    bool toBoolean() const;
    double toNumber() const;
    String toString() const;

    // Note that the NodeSet is shared with other Values that this one was copied from or that are copies of this one.
    NodeSet& modifiableNodeSet();

private:
    // This constructor creates ambiguity so that we don't accidentally call the boolean overload for pointer types.
    Value(void*) = delete;

    struct Data : public RefCounted<Data> {
        static Ref<Data> create() { return adoptRef(*new Data); }
        static Ref<Data> create(const String& string) { return adoptRef(*new Data(string)); }
        static Ref<Data> create(NodeSet&& nodeSet) { return adoptRef(*new Data(WTFMove(nodeSet))); }
        static Ref<Data> create(RefPtr<Node>&& node) { return adoptRef(*new Data(WTFMove(node))); }

        String string;
        NodeSet nodeSet;

    private:
        Data() { }
        explicit Data(const String& string)
            : string(string)
        { }
        explicit Data(NodeSet&& nodeSet)
            : nodeSet(WTFMove(nodeSet))
        { }
        explicit Data(RefPtr<Node>&& node)
            : nodeSet(WTFMove(node))
        { }
    };

    Type m_type;
    bool m_bool { false };
    double m_number { 0 };
    RefPtr<Data> m_data;
};

} // namespace XPath
} // namespace WebCore
