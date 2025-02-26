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
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/PrintStream.h>

#if ENABLE(WEBASSEMBLY)

namespace JSC {

enum class SIMDLaneOperation : uint8_t {
    Not,
    AddSat,
    LoadLane16,
    Andnot,
    GreaterThan,
    Abs,
    And,
    Store,
    StoreLane8,
    Xor,
    Trunc,
    ExtmulHigh,
    Splat,
    LoadExtend16S,
    LoadExtend8U,
    GreaterThanOrEqual,
    LoadLane8,
    Shl,
    DotProduct,
    Const,
    Demote,
    Convert,
    NotEqual,
    Sqrt,
    Pmin,
    StoreLane32,
    Pmax,
    LoadExtend32S,
    ExtendHigh,
    StoreLane64,
    LessThan,
    AvgRound,
    Min,
    Equal,
    LoadSplat8,
    LoadSplat32,
    LoadPad64,
    LoadExtend32U,
    Promote,
    Narrow,
    Load,
    Shuffle,
    SubSat,
    Max,
    AnyTrue,
    Ceil,
    LoadLane32,
    Mul,
    StoreLane16,
    Nearest,
    LoadExtend8S,
    ExtmulLow,
    Swizzle,
    Div,
    ConvertLow,
    Floor,
    LoadSplat16,
    AllTrue,
    Popcnt,
    LessThanOrEqual,
    Or,
    LoadExtend16U,
    ExtaddPairwise,
    TruncSat,
    LoadPad32,
    ExtractLane,
    ReplaceLane,
    ExtendLow,
    Shr,
    Add,
    LoadSplat64,
    LoadLane64,
    BitwiseSelect,
    Sub,
    Bitmask,
    Neg,
    MulSat,

    // relaxed SIMD
    RelaxedSwizzle,
    RelaxedTruncSat,
    RelaxedMAdd,
    RelaxedNMAdd,
    RelaxedLaneSelect,
};

#define FOR_EACH_WASM_EXT_SIMD_REL_OP(macro) \
macro(I8x16Eq,                    0x23,  Equal,               SIMDLane::i8x16,  SIMDSignMode::None,      B3::Air::Arg::relCond(MacroAssembler::Equal)) \
macro(I8x16Ne,                    0x24,  NotEqual,            SIMDLane::i8x16,  SIMDSignMode::None,      B3::Air::Arg::relCond(MacroAssembler::NotEqual)) \
macro(I8x16LtS,                   0x25,  LessThan,            SIMDLane::i8x16,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::LessThan)) \
macro(I8x16LtU,                   0x26,  LessThan,            SIMDLane::i8x16,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::Below)) \
macro(I8x16GtS,                   0x27,  GreaterThan,         SIMDLane::i8x16,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::GreaterThan)) \
macro(I8x16GtU,                   0x28,  GreaterThan,         SIMDLane::i8x16,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::Above)) \
macro(I8x16LeS,                   0x29,  LessThanOrEqual,     SIMDLane::i8x16,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::LessThanOrEqual)) \
macro(I8x16LeU,                   0x2a,  LessThanOrEqual,     SIMDLane::i8x16,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::BelowOrEqual)) \
macro(I8x16GeS,                   0x2b,  GreaterThanOrEqual,  SIMDLane::i8x16,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::GreaterThanOrEqual)) \
macro(I8x16GeU,                   0x2c,  GreaterThanOrEqual,  SIMDLane::i8x16,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::AboveOrEqual)) \
macro(I16x8Eq,                    0x2d,  Equal,               SIMDLane::i16x8,  SIMDSignMode::None,      B3::Air::Arg::relCond(MacroAssembler::Equal)) \
macro(I16x8Ne,                    0x2e,  NotEqual,            SIMDLane::i16x8,  SIMDSignMode::None,      B3::Air::Arg::relCond(MacroAssembler::NotEqual)) \
macro(I16x8LtS,                   0x2f,  LessThan,            SIMDLane::i16x8,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::LessThan)) \
macro(I16x8LtU,                   0x30,  LessThan,            SIMDLane::i16x8,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::Below)) \
macro(I16x8GtS,                   0x31,  GreaterThan,         SIMDLane::i16x8,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::GreaterThan)) \
macro(I16x8GtU,                   0x32,  GreaterThan,         SIMDLane::i16x8,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::Above)) \
macro(I16x8LeS,                   0x33,  LessThanOrEqual,     SIMDLane::i16x8,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::LessThanOrEqual)) \
macro(I16x8LeU,                   0x34,  LessThanOrEqual,     SIMDLane::i16x8,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::BelowOrEqual)) \
macro(I16x8GeS,                   0x35,  GreaterThanOrEqual,  SIMDLane::i16x8,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::GreaterThanOrEqual)) \
macro(I16x8GeU,                   0x36,  GreaterThanOrEqual,  SIMDLane::i16x8,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::AboveOrEqual)) \
macro(I32x4Eq,                    0x37,  Equal,               SIMDLane::i32x4,  SIMDSignMode::None,      B3::Air::Arg::relCond(MacroAssembler::Equal)) \
macro(I32x4Ne,                    0x38,  NotEqual,            SIMDLane::i32x4,  SIMDSignMode::None,      B3::Air::Arg::relCond(MacroAssembler::NotEqual)) \
macro(I32x4LtS,                   0x39,  LessThan,            SIMDLane::i32x4,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::LessThan)) \
macro(I32x4LtU,                   0x3a,  LessThan,            SIMDLane::i32x4,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::Below)) \
macro(I32x4GtS,                   0x3b,  GreaterThan,         SIMDLane::i32x4,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::GreaterThan)) \
macro(I32x4GtU,                   0x3c,  GreaterThan,         SIMDLane::i32x4,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::Above)) \
macro(I32x4LeS,                   0x3d,  LessThanOrEqual,     SIMDLane::i32x4,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::LessThanOrEqual)) \
macro(I32x4LeU,                   0x3e,  LessThanOrEqual,     SIMDLane::i32x4,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::BelowOrEqual)) \
macro(I32x4GeS,                   0x3f,  GreaterThanOrEqual,  SIMDLane::i32x4,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::GreaterThanOrEqual)) \
macro(I32x4GeU,                   0x40,  GreaterThanOrEqual,  SIMDLane::i32x4,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::AboveOrEqual)) \
macro(F32x4Eq,                    0x41,  Equal,               SIMDLane::f32x4,  SIMDSignMode::None,      B3::Air::Arg::doubleCond(MacroAssembler::DoubleEqualAndOrdered)) \
macro(F32x4Ne,                    0x42,  NotEqual,            SIMDLane::f32x4,  SIMDSignMode::None,      B3::Air::Arg::doubleCond(MacroAssembler::DoubleNotEqualOrUnordered)) \
macro(F32x4Lt,                    0x43,  LessThan,            SIMDLane::f32x4,  SIMDSignMode::None,      B3::Air::Arg::doubleCond(MacroAssembler::DoubleLessThanAndOrdered)) \
macro(F32x4Gt,                    0x44,  GreaterThan,         SIMDLane::f32x4,  SIMDSignMode::None,      B3::Air::Arg::doubleCond(MacroAssembler::DoubleGreaterThanAndOrdered)) \
macro(F32x4Le,                    0x45,  LessThanOrEqual,     SIMDLane::f32x4,  SIMDSignMode::None,      B3::Air::Arg::doubleCond(MacroAssembler::DoubleLessThanOrEqualAndOrdered)) \
macro(F32x4Ge,                    0x46,  GreaterThanOrEqual,  SIMDLane::f32x4,  SIMDSignMode::None,      B3::Air::Arg::doubleCond(MacroAssembler::DoubleGreaterThanOrEqualAndOrdered)) \
macro(F64x2Eq,                    0x47,  Equal,               SIMDLane::f64x2,  SIMDSignMode::None,      B3::Air::Arg::doubleCond(MacroAssembler::DoubleEqualAndOrdered)) \
macro(F64x2Ne,                    0x48,  NotEqual,            SIMDLane::f64x2,  SIMDSignMode::None,      B3::Air::Arg::doubleCond(MacroAssembler::DoubleNotEqualOrUnordered)) \
macro(F64x2Lt,                    0x49,  LessThan,            SIMDLane::f64x2,  SIMDSignMode::None,      B3::Air::Arg::doubleCond(MacroAssembler::DoubleLessThanAndOrdered)) \
macro(F64x2Gt,                    0x4a,  GreaterThan,         SIMDLane::f64x2,  SIMDSignMode::None,      B3::Air::Arg::doubleCond(MacroAssembler::DoubleGreaterThanAndOrdered)) \
macro(F64x2Le,                    0x4b,  LessThanOrEqual,     SIMDLane::f64x2,  SIMDSignMode::None,      B3::Air::Arg::doubleCond(MacroAssembler::DoubleLessThanOrEqualAndOrdered)) \
macro(F64x2Ge,                    0x4c,  GreaterThanOrEqual,  SIMDLane::f64x2,  SIMDSignMode::None,      B3::Air::Arg::doubleCond(MacroAssembler::DoubleGreaterThanOrEqualAndOrdered)) \
macro(I64x2Eq,                    0xd6,  Equal,               SIMDLane::i64x2,  SIMDSignMode::None,      B3::Air::Arg::relCond(MacroAssembler::Equal)) \
macro(I64x2Ne,                    0xd7,  NotEqual,            SIMDLane::i64x2,  SIMDSignMode::None,      B3::Air::Arg::relCond(MacroAssembler::NotEqual)) \
macro(I64x2LtS,                   0xd8,  LessThan,            SIMDLane::i64x2,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::LessThan)) \
macro(I64x2GtS,                   0xd9,  GreaterThan,         SIMDLane::i64x2,  SIMDSignMode::Signed,    B3::Air::Arg::relCond(MacroAssembler::GreaterThan)) \
macro(I64x2LeU,                   0xda,  LessThanOrEqual,     SIMDLane::i64x2,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::LessThanOrEqual)) \
macro(I64x2GeU,                   0xdb,  GreaterThanOrEqual,  SIMDLane::i64x2,  SIMDSignMode::Unsigned,  B3::Air::Arg::relCond(MacroAssembler::GreaterThanOrEqual))


#define FOR_EACH_WASM_EXT_SIMD_GENERAL_OP(macro) \
macro(I8x16Swizzle,               0x0e,  Swizzle,             SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I8x16ExtractLaneS,          0x15,  ExtractLane,         SIMDLane::i8x16,  SIMDSignMode::Signed) \
macro(I8x16ExtractLaneU,          0x16,  ExtractLane,         SIMDLane::i8x16,  SIMDSignMode::Unsigned) \
macro(I8x16ReplaceLane,           0x17,  ReplaceLane,         SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I16x8ExtractLaneS,          0x18,  ExtractLane,         SIMDLane::i16x8,  SIMDSignMode::Signed) \
macro(I16x8ExtractLaneU,          0x19,  ExtractLane,         SIMDLane::i16x8,  SIMDSignMode::Unsigned) \
macro(I16x8ReplaceLane,           0x1a,  ReplaceLane,         SIMDLane::i16x8,  SIMDSignMode::None) \
macro(I32x4ExtractLane,           0x1b,  ExtractLane,         SIMDLane::i32x4,  SIMDSignMode::None) \
macro(I32x4ReplaceLane,           0x1c,  ReplaceLane,         SIMDLane::i32x4,  SIMDSignMode::None) \
macro(I64x2ExtractLane,           0x1d,  ExtractLane,         SIMDLane::i64x2,  SIMDSignMode::None) \
macro(I64x2ReplaceLane,           0x1e,  ReplaceLane,         SIMDLane::i64x2,  SIMDSignMode::None) \
macro(F32x4ExtractLane,           0x1f,  ExtractLane,         SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4ReplaceLane,           0x20,  ReplaceLane,         SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F64x2ExtractLane,           0x21,  ExtractLane,         SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2ReplaceLane,           0x22,  ReplaceLane,         SIMDLane::f64x2,  SIMDSignMode::None) \
macro(V128Not,                    0x4d,  Not,                 SIMDLane::v128,   SIMDSignMode::None) \
macro(V128And,                    0x4e,  And,                 SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Andnot,                 0x4f,  Andnot,              SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Or,                     0x50,  Or,                  SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Xor,                    0x51,  Xor,                 SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Bitselect,              0x52,  BitwiseSelect,       SIMDLane::v128,   SIMDSignMode::None) \
macro(V128AnyTrue,                0x53,  AnyTrue,             SIMDLane::v128,   SIMDSignMode::None) \
macro(F32x4DemoteF64x2Zero,       0x5e,  Demote,              SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2PromoteLowF32x4,       0x5f,  Promote,             SIMDLane::f32x4,  SIMDSignMode::None) \
macro(I8x16Abs,                   0x60,  Abs,                 SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I8x16Neg,                   0x61,  Neg,                 SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I8x16Popcnt,                0x62,  Popcnt,              SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I8x16AllTrue,               0x63,  AllTrue,             SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I8x16Bitmask,               0x64,  Bitmask,             SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I8x16NarrowI16x8S,          0x65,  Narrow,              SIMDLane::i16x8,  SIMDSignMode::Signed) \
macro(I8x16NarrowI16x8U,          0x66,  Narrow,              SIMDLane::i16x8,  SIMDSignMode::Unsigned) \
macro(F32x4Ceil,                  0x67,  Ceil,                SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4Floor,                 0x68,  Floor,               SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4Trunc,                 0x69,  Trunc,               SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4Nearest,               0x6a,  Nearest,             SIMDLane::f32x4,  SIMDSignMode::None) \
macro(I8x16Add,                   0x6e,  Add,                 SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I8x16AddSatS,               0x6f,  AddSat,              SIMDLane::i8x16,  SIMDSignMode::Signed) \
macro(I8x16AddSatU,               0x70,  AddSat,              SIMDLane::i8x16,  SIMDSignMode::Unsigned) \
macro(I8x16Sub,                   0x71,  Sub,                 SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I8x16SubSatS,               0x72,  SubSat,              SIMDLane::i8x16,  SIMDSignMode::Signed) \
macro(I8x16SubSatU,               0x73,  SubSat,              SIMDLane::i8x16,  SIMDSignMode::Unsigned) \
macro(F64x2Ceil,                  0x74,  Ceil,                SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2Floor,                 0x75,  Floor,               SIMDLane::f64x2,  SIMDSignMode::None) \
macro(I8x16MinS,                  0x76,  Min,                 SIMDLane::i8x16,  SIMDSignMode::Signed) \
macro(I8x16MinU,                  0x77,  Min,                 SIMDLane::i8x16,  SIMDSignMode::Unsigned) \
macro(I8x16MaxS,                  0x78,  Max,                 SIMDLane::i8x16,  SIMDSignMode::Signed) \
macro(I8x16MaxU,                  0x79,  Max,                 SIMDLane::i8x16,  SIMDSignMode::Unsigned) \
macro(F64x2Trunc,                 0x7a,  Trunc,               SIMDLane::f64x2,  SIMDSignMode::None) \
macro(I8x16AvgrU,                 0x7b,  AvgRound,            SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I16x8ExtaddPairwiseI8x16S,  0x7c,  ExtaddPairwise,      SIMDLane::i8x16,  SIMDSignMode::Signed) \
macro(I16x8ExtaddPairwiseI8x16U,  0x7d,  ExtaddPairwise,      SIMDLane::i8x16,  SIMDSignMode::Unsigned) \
macro(I32x4ExtaddPairwiseI16x8S,  0x7e,  ExtaddPairwise,      SIMDLane::i16x8,  SIMDSignMode::Signed) \
macro(I32x4ExtaddPairwiseI16x8U,  0x7f,  ExtaddPairwise,      SIMDLane::i16x8,  SIMDSignMode::Unsigned) \
macro(I16x8Abs,                   0x80,  Abs,                 SIMDLane::i16x8,  SIMDSignMode::None) \
macro(I16x8Neg,                   0x81,  Neg,                 SIMDLane::i16x8,  SIMDSignMode::None) \
macro(I16x8Q15mulrSatS,           0x82,  MulSat,              SIMDLane::i16x8,  SIMDSignMode::None) \
macro(I16x8AllTrue,               0x83,  AllTrue,             SIMDLane::i16x8,  SIMDSignMode::None) \
macro(I16x8Bitmask,               0x84,  Bitmask,             SIMDLane::i16x8,  SIMDSignMode::None) \
macro(I16x8NarrowI32x4S,          0x85,  Narrow,              SIMDLane::i32x4,  SIMDSignMode::Signed) \
macro(I16x8NarrowI32x4U,          0x86,  Narrow,              SIMDLane::i32x4,  SIMDSignMode::Unsigned) \
macro(I16x8ExtendLowI8x16S,       0x87,  ExtendLow,           SIMDLane::i16x8,  SIMDSignMode::Signed) \
macro(I16x8ExtendHighI8x16S,      0x88,  ExtendHigh,          SIMDLane::i16x8,  SIMDSignMode::Signed) \
macro(I16x8ExtendLowI8x16U,       0x89,  ExtendLow,           SIMDLane::i16x8,  SIMDSignMode::Unsigned) \
macro(I16x8ExtendHighI8x16U,      0x8a,  ExtendHigh,          SIMDLane::i16x8,  SIMDSignMode::Unsigned) \
macro(I16x8Add,                   0x8e,  Add,                 SIMDLane::i16x8,  SIMDSignMode::None) \
macro(I16x8AddSatS,               0x8f,  AddSat,              SIMDLane::i16x8,  SIMDSignMode::Signed) \
macro(I16x8AddSatU,               0x90,  AddSat,              SIMDLane::i16x8,  SIMDSignMode::Unsigned) \
macro(I16x8Sub,                   0x91,  Sub,                 SIMDLane::i16x8,  SIMDSignMode::None) \
macro(I16x8SubSatS,               0x92,  SubSat,              SIMDLane::i16x8,  SIMDSignMode::Signed) \
macro(I16x8SubSatU,               0x93,  SubSat,              SIMDLane::i16x8,  SIMDSignMode::Unsigned) \
macro(F64x2Nearest,               0x94,  Nearest,             SIMDLane::f64x2,  SIMDSignMode::None) \
macro(I16x8Mul,                   0x95,  Mul,                 SIMDLane::i16x8,  SIMDSignMode::None) \
macro(I16x8MinS,                  0x96,  Min,                 SIMDLane::i16x8,  SIMDSignMode::Signed) \
macro(I16x8MinU,                  0x97,  Min,                 SIMDLane::i16x8,  SIMDSignMode::Unsigned) \
macro(I16x8MaxS,                  0x98,  Max,                 SIMDLane::i16x8,  SIMDSignMode::Signed) \
macro(I16x8MaxU,                  0x99,  Max,                 SIMDLane::i16x8,  SIMDSignMode::Unsigned) \
macro(I16x8AvgrU,                 0x9b,  AvgRound,            SIMDLane::i16x8,  SIMDSignMode::None) \
macro(I32x4Abs,                   0xa0,  Abs,                 SIMDLane::i32x4,  SIMDSignMode::None) \
macro(I32x4Neg,                   0xa1,  Neg,                 SIMDLane::i32x4,  SIMDSignMode::None) \
macro(I32x4AllTrue,               0xa3,  AllTrue,             SIMDLane::i32x4,  SIMDSignMode::None) \
macro(I32x4Bitmask,               0xa4,  Bitmask,             SIMDLane::i32x4,  SIMDSignMode::None) \
macro(I32x4ExtendLowI16x8S,       0xa7,  ExtendLow,           SIMDLane::i32x4,  SIMDSignMode::Signed) \
macro(I32x4ExtendHighI16x8S,      0xa8,  ExtendHigh,          SIMDLane::i32x4,  SIMDSignMode::Signed) \
macro(I32x4ExtendLowI16x8U,       0xa9,  ExtendLow,           SIMDLane::i32x4,  SIMDSignMode::Unsigned) \
macro(I32x4ExtendHighI16x8U,      0xaa,  ExtendHigh,          SIMDLane::i32x4,  SIMDSignMode::Unsigned) \
macro(I32x4Add,                   0xae,  Add,                 SIMDLane::i32x4,  SIMDSignMode::None) \
macro(I32x4Sub,                   0xb1,  Sub,                 SIMDLane::i32x4,  SIMDSignMode::None) \
macro(I32x4Mul,                   0xb5,  Mul,                 SIMDLane::i32x4,  SIMDSignMode::None) \
macro(I32x4MinS,                  0xb6,  Min,                 SIMDLane::i32x4,  SIMDSignMode::Signed) \
macro(I32x4MinU,                  0xb7,  Min,                 SIMDLane::i32x4,  SIMDSignMode::Unsigned) \
macro(I32x4MaxS,                  0xb8,  Max,                 SIMDLane::i32x4,  SIMDSignMode::Signed) \
macro(I32x4MaxU,                  0xb9,  Max,                 SIMDLane::i32x4,  SIMDSignMode::Unsigned) \
macro(I32x4DotI16x8S,             0xba,  DotProduct,          SIMDLane::i32x4,  SIMDSignMode::None) \
macro(I64x2Abs,                   0xc0,  Abs,                 SIMDLane::i64x2,  SIMDSignMode::None) \
macro(I64x2Neg,                   0xc1,  Neg,                 SIMDLane::i64x2,  SIMDSignMode::None) \
macro(I64x2AllTrue,               0xc3,  AllTrue,             SIMDLane::i64x2,  SIMDSignMode::None) \
macro(I64x2Bitmask,               0xc4,  Bitmask,             SIMDLane::i64x2,  SIMDSignMode::None) \
macro(I64x2ExtendLowI32x4S,       0xc7,  ExtendLow,           SIMDLane::i64x2,  SIMDSignMode::Signed) \
macro(I64x2ExtendHighI32x4S,      0xc8,  ExtendHigh,          SIMDLane::i64x2,  SIMDSignMode::Signed) \
macro(I64x2ExtendLowI32x4U,       0xc9,  ExtendLow,           SIMDLane::i64x2,  SIMDSignMode::Unsigned) \
macro(I64x2ExtendHighI32x4U,      0xca,  ExtendHigh,          SIMDLane::i64x2,  SIMDSignMode::Unsigned) \
macro(I64x2Add,                   0xce,  Add,                 SIMDLane::i64x2,  SIMDSignMode::None) \
macro(I64x2Sub,                   0xd1,  Sub,                 SIMDLane::i64x2,  SIMDSignMode::None) \
macro(I64x2Mul,                   0xd5,  Mul,                 SIMDLane::i64x2,  SIMDSignMode::None) \
macro(F32x4Abs,                   0xe0,  Abs,                 SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4Neg,                   0xe1,  Neg,                 SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4Sqrt,                  0xe3,  Sqrt,                SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4Add,                   0xe4,  Add,                 SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4Sub,                   0xe5,  Sub,                 SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4Mul,                   0xe6,  Mul,                 SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4Div,                   0xe7,  Div,                 SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4Min,                   0xe8,  Min,                 SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4Max,                   0xe9,  Max,                 SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4Pmin,                  0xea,  Pmin,                SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4Pmax,                  0xeb,  Pmax,                SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F64x2Abs,                   0xec,  Abs,                 SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2Neg,                   0xed,  Neg,                 SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2Sqrt,                  0xef,  Sqrt,                SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2Add,                   0xf0,  Add,                 SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2Sub,                   0xf1,  Sub,                 SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2Mul,                   0xf2,  Mul,                 SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2Div,                   0xf3,  Div,                 SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2Min,                   0xf4,  Min,                 SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2Max,                   0xf5,  Max,                 SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2Pmin,                  0xf6,  Pmin,                SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2Pmax,                  0xf7,  Pmax,                SIMDLane::f64x2,  SIMDSignMode::None) \
macro(I32x4TruncSatF32x4S,        0xf8,  TruncSat,            SIMDLane::f32x4,  SIMDSignMode::Signed) \
macro(I32x4TruncSatF32x4U,        0xf9,  TruncSat,            SIMDLane::f32x4,  SIMDSignMode::Unsigned) \
macro(F32x4ConvertI32x4S,         0xfa,  Convert,             SIMDLane::i32x4,  SIMDSignMode::Signed) \
macro(F32x4ConvertI32x4U,         0xfb,  Convert,             SIMDLane::i32x4,  SIMDSignMode::Unsigned) \
macro(I32x4TruncSatF64x2SZero,    0xfc,  TruncSat,            SIMDLane::f64x2,  SIMDSignMode::Signed) \
macro(I32x4TruncSatF64x2UZero,    0xfd,  TruncSat,            SIMDLane::f64x2,  SIMDSignMode::Unsigned) \
macro(F64x2ConvertLowI32x4S,      0xfe,  ConvertLow,          SIMDLane::i32x4,  SIMDSignMode::Signed) \
macro(F64x2ConvertLowI32x4U,      0xff,  ConvertLow,          SIMDLane::i32x4,  SIMDSignMode::Unsigned) \
macro(V128Load,                   0x00,  Load,                SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Load8x8S,               0x01,  LoadExtend8S,        SIMDLane::v128,   SIMDSignMode::Signed) \
macro(V128Load8x8U,               0x02,  LoadExtend8U,        SIMDLane::v128,   SIMDSignMode::Unsigned) \
macro(V128Load16x4S,              0x03,  LoadExtend16S,       SIMDLane::v128,   SIMDSignMode::Signed) \
macro(V128Load16x4U,              0x04,  LoadExtend16U,       SIMDLane::v128,   SIMDSignMode::Unsigned) \
macro(V128Load32x2S,              0x05,  LoadExtend32S,       SIMDLane::v128,   SIMDSignMode::Signed) \
macro(V128Load32x2U,              0x06,  LoadExtend32U,       SIMDLane::v128,   SIMDSignMode::Unsigned) \
macro(V128Load8Splat,             0x07,  LoadSplat8,          SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Load16Splat,            0x08,  LoadSplat16,         SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Load32Splat,            0x09,  LoadSplat32,         SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Load64Splat,            0xa,   LoadSplat64,         SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Store,                  0xb,   Store,               SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Const,                  0xc,   Const,               SIMDLane::v128,   SIMDSignMode::None) \
macro(I8x16Shuffle,               0xd,   Shuffle,             SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I8x16Splat,                 0xf,   Splat,               SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I16x8Splat,                 0x10,  Splat,               SIMDLane::i16x8,  SIMDSignMode::None) \
macro(I32x4Splat,                 0x11,  Splat,               SIMDLane::i32x4,  SIMDSignMode::None) \
macro(I64x2Splat,                 0x12,  Splat,               SIMDLane::i64x2,  SIMDSignMode::None) \
macro(F32x4Splat,                 0x13,  Splat,               SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F64x2Splat,                 0x14,  Splat,               SIMDLane::f64x2,  SIMDSignMode::None) \
macro(V128Load8Lane,              0x54,  LoadLane8,           SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Load16Lane,             0x55,  LoadLane16,          SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Load32Lane,             0x56,  LoadLane32,          SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Load64Lane,             0x57,  LoadLane64,          SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Store8Lane,             0x58,  StoreLane8,          SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Store16Lane,            0x59,  StoreLane16,         SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Store32Lane,            0x5a,  StoreLane32,         SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Store64Lane,            0x5b,  StoreLane64,         SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Load32Zero,             0x5c,  LoadPad32,           SIMDLane::v128,   SIMDSignMode::None) \
macro(V128Load64Zero,             0x5d,  LoadPad64,           SIMDLane::v128,   SIMDSignMode::None) \
macro(I8x16Shl,                   0x6b,  Shl,                 SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I8x16ShrS,                  0x6c,  Shr,                 SIMDLane::i8x16,  SIMDSignMode::Signed) \
macro(I8x16ShrU,                  0x6d,  Shr,                 SIMDLane::i8x16,  SIMDSignMode::Unsigned) \
macro(I16x8Shl,                   0x8b,  Shl,                 SIMDLane::i16x8,  SIMDSignMode::None) \
macro(I16x8ShrS,                  0x8c,  Shr,                 SIMDLane::i16x8,  SIMDSignMode::Signed) \
macro(I16x8ShrU,                  0x8d,  Shr,                 SIMDLane::i16x8,  SIMDSignMode::Unsigned) \
macro(I16x8ExtmulLowI8x16S,       0x9c,  ExtmulLow,           SIMDLane::i16x8,  SIMDSignMode::Signed) \
macro(I16x8ExtmulHighI8x16S,      0x9d,  ExtmulHigh,          SIMDLane::i16x8,  SIMDSignMode::Signed) \
macro(I16x8ExtmulLowI8x16U,       0x9e,  ExtmulLow,           SIMDLane::i16x8,  SIMDSignMode::Unsigned) \
macro(I16x8ExtmulHighI8x16U,      0x9f,  ExtmulHigh,          SIMDLane::i16x8,  SIMDSignMode::Unsigned) \
macro(I32x4Shl,                   0xab,  Shl,                 SIMDLane::i32x4,  SIMDSignMode::None) \
macro(I32x4ShrS,                  0xac,  Shr,                 SIMDLane::i32x4,  SIMDSignMode::Signed) \
macro(I32x4ShrU,                  0xad,  Shr,                 SIMDLane::i32x4,  SIMDSignMode::Unsigned) \
macro(I32x4ExtmulLowI16x8S,       0xbc,  ExtmulLow,           SIMDLane::i32x4,  SIMDSignMode::Signed) \
macro(I32x4ExtmulHighI16x8S,      0xbd,  ExtmulHigh,          SIMDLane::i32x4,  SIMDSignMode::Signed) \
macro(I32x4ExtmulLowI16x8U,       0xbe,  ExtmulLow,           SIMDLane::i32x4,  SIMDSignMode::Unsigned) \
macro(I32x4ExtmulHighI16x8U,      0xbf,  ExtmulHigh,          SIMDLane::i32x4,  SIMDSignMode::Unsigned) \
macro(I64x2Shl,                   0xcb,  Shl,                 SIMDLane::i64x2,  SIMDSignMode::None) \
macro(I64x2ShrS,                  0xcc,  Shr,                 SIMDLane::i64x2,  SIMDSignMode::Signed) \
macro(I64x2ShrU,                  0xcd,  Shr,                 SIMDLane::i64x2,  SIMDSignMode::Unsigned) \
macro(I64x2ExtmulLowI32x4S,       0xdc,  ExtmulLow,           SIMDLane::i64x2,  SIMDSignMode::Signed) \
macro(I64x2ExtmulHighI32x4S,      0xdd,  ExtmulHigh,          SIMDLane::i64x2,  SIMDSignMode::Signed) \
macro(I64x2ExtmulLowI32x4U,       0xde,  ExtmulLow,           SIMDLane::i64x2,  SIMDSignMode::Unsigned) \
macro(I64x2ExtmulHighI32x4U,      0xdf,  ExtmulHigh,          SIMDLane::i64x2,  SIMDSignMode::Unsigned) \
macro(I8x16RelaxedSwizzle,        0x100, RelaxedSwizzle,      SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I32x4RelaxedTruncF32x4S,    0x101, RelaxedTruncSat,     SIMDLane::f32x4,  SIMDSignMode::Signed) \
macro(I32x4RelaxedTruncF32x4U,    0x102, RelaxedTruncSat,     SIMDLane::f32x4,  SIMDSignMode::Unsigned) \
macro(I32x4RelaxedTruncF64x2SZero, 0x103, RelaxedTruncSat,    SIMDLane::f64x2,  SIMDSignMode::Signed) \
macro(I32x4RelaxedTruncF64x2UZero, 0x104, RelaxedTruncSat,    SIMDLane::f64x2,  SIMDSignMode::Unsigned) \
macro(F32x4RelaxedMAdd,           0x105, RelaxedMAdd,         SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F32x4RelaxedNMAdd,          0x106, RelaxedNMAdd,        SIMDLane::f32x4,  SIMDSignMode::None) \
macro(F64x2RelaxedMAdd,           0x107, RelaxedMAdd,         SIMDLane::f64x2,  SIMDSignMode::None) \
macro(F64x2RelaxedNMAdd,          0x108, RelaxedNMAdd,        SIMDLane::f64x2,  SIMDSignMode::None) \
macro(I8x16RelaxedLaneSelect,     0x109, RelaxedLaneSelect,   SIMDLane::i8x16,  SIMDSignMode::None) \
macro(I16x8RelaxedLaneSelect,     0x10a, RelaxedLaneSelect,   SIMDLane::i16x8,  SIMDSignMode::None) \
macro(I32x4RelaxedLaneSelect,     0x10b, RelaxedLaneSelect,   SIMDLane::i32x4,  SIMDSignMode::None) \
macro(I64x2RelaxedLaneSelect,     0x10c, RelaxedLaneSelect,   SIMDLane::i64x2,  SIMDSignMode::None)

#define FOR_EACH_WASM_EXT_SIMD_OP(macro) \
FOR_EACH_WASM_EXT_SIMD_REL_OP(macro) \
FOR_EACH_WASM_EXT_SIMD_GENERAL_OP(macro)

static void dumpSIMDLaneOperation(PrintStream& out, SIMDLaneOperation op)
{
    switch (op) {
    case SIMDLaneOperation::Not: out.print("Not"); break;
    case SIMDLaneOperation::AddSat: out.print("AddSat"); break;
    case SIMDLaneOperation::LoadLane16: out.print("LoadLane16"); break;
    case SIMDLaneOperation::Andnot: out.print("Andnot"); break;
    case SIMDLaneOperation::GreaterThan: out.print("Gt"); break;
    case SIMDLaneOperation::Abs: out.print("Abs"); break;
    case SIMDLaneOperation::And: out.print("And"); break;
    case SIMDLaneOperation::Store: out.print("Store"); break;
    case SIMDLaneOperation::StoreLane8: out.print("StoreLane8"); break;
    case SIMDLaneOperation::Xor: out.print("Xor"); break;
    case SIMDLaneOperation::Trunc: out.print("Trunc"); break;
    case SIMDLaneOperation::ExtmulHigh: out.print("ExtmulHigh"); break;
    case SIMDLaneOperation::Splat: out.print("Splat"); break;
    case SIMDLaneOperation::LoadExtend16S: out.print("LoadExtend16S"); break;
    case SIMDLaneOperation::LoadExtend8U: out.print("LoadExtend8U"); break;
    case SIMDLaneOperation::GreaterThanOrEqual: out.print("Ge"); break;
    case SIMDLaneOperation::LoadLane8: out.print("LoadLane8"); break;
    case SIMDLaneOperation::Shl: out.print("Shl"); break;
    case SIMDLaneOperation::DotProduct: out.print("DotProduct"); break;
    case SIMDLaneOperation::Const: out.print("Const"); break;
    case SIMDLaneOperation::Demote: out.print("Demote"); break;
    case SIMDLaneOperation::Convert: out.print("Convert"); break;
    case SIMDLaneOperation::NotEqual: out.print("Ne"); break;
    case SIMDLaneOperation::Sqrt: out.print("Sqrt"); break;
    case SIMDLaneOperation::Pmin: out.print("Pmin"); break;
    case SIMDLaneOperation::StoreLane32: out.print("StoreLane32"); break;
    case SIMDLaneOperation::Pmax: out.print("Pmax"); break;
    case SIMDLaneOperation::LoadExtend32S: out.print("LoadExtend32S"); break;
    case SIMDLaneOperation::ExtendHigh: out.print("ExtendHigh"); break;
    case SIMDLaneOperation::StoreLane64: out.print("StoreLane64"); break;
    case SIMDLaneOperation::LessThan: out.print("Lt"); break;
    case SIMDLaneOperation::AvgRound: out.print("AvgRound"); break;
    case SIMDLaneOperation::Min: out.print("Min"); break;
    case SIMDLaneOperation::Equal: out.print("Eq"); break;
    case SIMDLaneOperation::LoadSplat8: out.print("LoadSplat8"); break;
    case SIMDLaneOperation::LoadSplat32: out.print("LoadSplat32"); break;
    case SIMDLaneOperation::LoadPad64: out.print("LoadPad64"); break;
    case SIMDLaneOperation::LoadExtend32U: out.print("LoadExtend32U"); break;
    case SIMDLaneOperation::Promote: out.print("Promote"); break;
    case SIMDLaneOperation::Narrow: out.print("Narrow"); break;
    case SIMDLaneOperation::Load: out.print("Load"); break;
    case SIMDLaneOperation::Shuffle: out.print("Shuffle"); break;
    case SIMDLaneOperation::SubSat: out.print("SubSat"); break;
    case SIMDLaneOperation::Max: out.print("Max"); break;
    case SIMDLaneOperation::AnyTrue: out.print("AnyTrue"); break;
    case SIMDLaneOperation::Ceil: out.print("Ceil"); break;
    case SIMDLaneOperation::LoadLane32: out.print("LoadLane32"); break;
    case SIMDLaneOperation::Mul: out.print("Mul"); break;
    case SIMDLaneOperation::StoreLane16: out.print("StoreLane16"); break;
    case SIMDLaneOperation::Nearest: out.print("Nearest"); break;
    case SIMDLaneOperation::LoadExtend8S: out.print("LoadExtend8S"); break;
    case SIMDLaneOperation::ExtmulLow: out.print("ExtmulLow"); break;
    case SIMDLaneOperation::Swizzle: out.print("Swizzle"); break;
    case SIMDLaneOperation::Div: out.print("Div"); break;
    case SIMDLaneOperation::ConvertLow: out.print("ConvertLow"); break;
    case SIMDLaneOperation::Floor: out.print("Floor"); break;
    case SIMDLaneOperation::LoadSplat16: out.print("LoadSplat16"); break;
    case SIMDLaneOperation::AllTrue: out.print("AllTrue"); break;
    case SIMDLaneOperation::Popcnt: out.print("Popcnt"); break;
    case SIMDLaneOperation::LessThanOrEqual: out.print("Le"); break;
    case SIMDLaneOperation::Or: out.print("Or"); break;
    case SIMDLaneOperation::LoadExtend16U: out.print("LoadExtend16U"); break;
    case SIMDLaneOperation::ExtaddPairwise: out.print("ExtaddPairwise"); break;
    case SIMDLaneOperation::TruncSat: out.print("TruncSat"); break;
    case SIMDLaneOperation::LoadPad32: out.print("LoadPad32"); break;
    case SIMDLaneOperation::ExtractLane: out.print("ExtractLane"); break;
    case SIMDLaneOperation::ReplaceLane: out.print("ReplaceLane"); break;
    case SIMDLaneOperation::ExtendLow: out.print("ExtendLow"); break;
    case SIMDLaneOperation::Shr: out.print("Shr"); break;
    case SIMDLaneOperation::Add: out.print("Add"); break;
    case SIMDLaneOperation::LoadSplat64: out.print("LoadSplat64"); break;
    case SIMDLaneOperation::LoadLane64: out.print("LoadLane64"); break;
    case SIMDLaneOperation::BitwiseSelect: out.print("BitwiseSelect"); break;
    case SIMDLaneOperation::Sub: out.print("Sub"); break;
    case SIMDLaneOperation::Bitmask: out.print("Bitmask"); break;
    case SIMDLaneOperation::Neg: out.print("Neg"); break;
    case SIMDLaneOperation::MulSat: out.print("MulSat"); break;
    case SIMDLaneOperation::RelaxedSwizzle: out.print("RelaxedSwizzle"); break;
    case SIMDLaneOperation::RelaxedTruncSat: out.print("RelaxedTruncSat"); break;
    case SIMDLaneOperation::RelaxedMAdd: out.print("RelaxedMAdd"); break;
    case SIMDLaneOperation::RelaxedNMAdd: out.print("RelaxedNMAdd"); break;
    case SIMDLaneOperation::RelaxedLaneSelect: out.print("RelaxedLaneSelect"); break;
    }
}
MAKE_PRINT_ADAPTOR(SIMDLaneOperationDump, SIMDLaneOperation, dumpSIMDLaneOperation);

// Relaxed SIMD

inline bool isRelaxedSIMDOperation(SIMDLaneOperation op)
{
    switch (op) {
    case SIMDLaneOperation::RelaxedSwizzle:
    case SIMDLaneOperation::RelaxedTruncSat:
    case SIMDLaneOperation::RelaxedMAdd:
    case SIMDLaneOperation::RelaxedNMAdd:
    case SIMDLaneOperation::RelaxedLaneSelect:
        return true;
    default:
        return false;
    }
}

}
#endif // ENABLE(WEBASSEMBLY)
