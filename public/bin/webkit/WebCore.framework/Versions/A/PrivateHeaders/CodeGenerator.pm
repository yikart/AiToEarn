#
# WebKit IDL parser
#
# Copyright (C) 2005 Nikolas Zimmermann <wildfox@kde.org>
# Copyright (C) 2006 Samuel Weinig <sam.weinig@gmail.com>
# Copyright (C) 2007, 2008, 2009, 2010 Apple Inc. All rights reserved.
# Copyright (C) 2009 Cameron McCormack <cam@mcc.id.au>
# Copyright (C) Research In Motion Limited 2010. All rights reserved.
# Copyright (C) 2013 Samsung Electronics. All rights reserved.
#
# This library is free software; you can redistribute it and/or
# modify it under the terms of the GNU Library General Public
# License as published by the Free Software Foundation; either
# version 2 of the License, or (at your option) any later version.
#
# This library is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# Library General Public License for more details.
#
# You should have received a copy of the GNU Library General Public License
# along with this library; see the file COPYING.LIB.  If not, write to
# the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
# Boston, MA 02110-1301, USA.
#

package CodeGenerator;

use strict;

use File::Basename;
use Carp qw<longmess>;
use Data::Dumper;

my $useDocument = "";
my $useGenerator = "";
my $useOutputDir = "";
my $useOutputHeadersDir = "";
my $preprocessor;
my $idlAttributes;
my $writeDependencies = 0;
my $defines = "";
my $targetIdlFilePath = "";
my $supplementalDependencies;
my $idlFileNamesList;

my $codeGenerator = 0;

my $verbose = 0;

my %integerTypeHash = (
    "byte" => 1,
    "long long" => 1,
    "long" => 1,
    "octet" => 1,
    "short" => 1,
    "unsigned long long" => 1,
    "unsigned long" => 1,
    "unsigned short" => 1,
);

my %floatingPointTypeHash = (
    "float" => 1,
    "unrestricted float" => 1,
    "double" => 1,
    "unrestricted double" => 1,
);

my %stringTypeHash = (
    "ByteString" => 1,
    "DOMString" => 1,
    "USVString" => 1,
);

my %bufferSourceTypes = (
    "ArrayBuffer" => 1,
    "ArrayBufferView" => 1,
    "DataView" => 1,
    "Float16Array" => 1,
    "Float32Array" => 1,
    "Float64Array" => 1,
    "Int16Array" => 1,
    "Int32Array" => 1,
    "Int8Array" => 1,
    "Uint16Array" => 1,
    "Uint32Array" => 1,
    "Uint8Array" => 1,
    "Uint8ClampedArray" => 1,
    "BigInt64Array" => 1,
    "BigUint64Array" => 1,
);

my %primitiveTypeHash = ( 
    "boolean" => 1, 
    "undefined" => 1,
    "Date" => 1
);

my %dictionaryTypeImplementationNameOverrides = ();
my %enumTypeImplementationNameOverrides = ();

my %svgAttributesInHTMLHash = (
    "class" => 1,
    "id" => 1,
    "onabort" => 1,
    "onclick" => 1,
    "onerror" => 1,
    "onload" => 1,
    "onmousedown" => 1,
    "onmouseenter" => 1,
    "onmouseleave" => 1,
    "onmousemove" => 1,
    "onmouseout" => 1,
    "onmouseover" => 1,
    "onmouseup" => 1,
    "onresize" => 1,
    "onscroll" => 1,
    "onunload" => 1,
);

# Cache of IDL file pathnames.
my $idlFiles;
my $cachedInterfaces = {};
my $cachedExtendedAttributes = {};
my $cachedExternalDictionaries = {};
my $cachedExternalEnumerations = {};
my $cachedTypes = {};

sub assert
{
    my $message = shift;
    
    my $mess = longmess();
    print Dumper($mess);

    die $message;
}

# Default constructor
sub new
{
    my $object = shift;
    my $reference = { };

    $useGenerator = shift;
    $useOutputDir = shift;
    $useOutputHeadersDir = shift;
    $preprocessor = shift;
    $writeDependencies = shift;
    $verbose = shift;
    $targetIdlFilePath = shift;
    $idlAttributes = shift;
    $supplementalDependencies = shift;
    $idlFileNamesList = shift;

    bless($reference, $object);
    return $reference;
}

sub ProcessDocument
{
    my $object = shift;
    $useDocument = shift;
    $defines = shift;

    my $ifaceName = "CodeGenerator" . $useGenerator;
    require $ifaceName . ".pm";

    # Dynamically load external code generation perl module
    $codeGenerator = $ifaceName->new($object, $writeDependencies, $verbose, $targetIdlFilePath);
    unless (defined($codeGenerator)) {
        my $interfaces = $useDocument->interfaces;
        foreach my $interface (@$interfaces) {
            print "Skipping $useGenerator code generation for IDL interface \"" . $interface->type->name . "\".\n" if $verbose;
        }
        return;
    }

    if (@{$useDocument->interfaces}) {
        $object->ProcessInterfaces($useDocument, $defines, $codeGenerator);
        return;
    }

    if (@{$useDocument->callbackFunctions}) {
        $object->ProcessCallbackFunctions($useDocument, $defines, $codeGenerator);
        return;
    }

    if (@{$useDocument->dictionaries}) {
        $object->ProcessDictionaries($useDocument, $defines, $codeGenerator);
        return;
    }
    
    if (@{$useDocument->enumerations}) {
        $object->ProcessEnumerations($useDocument, $defines, $codeGenerator);
        return;
    }

    # die "Processing document " . $useDocument->fileName . " did not generate anything.";
}

sub GenerateEmptyHeaderAndCpp
{
    my ($object, $useDocument, $codeGenerator) = @_;

    my $targetName = fileparse($useDocument->fileName, ".idl");
    my $prefix = $codeGenerator->FileNamePrefix();

    my $headerName = "${prefix}${targetName}.h";
    my $cppName = "${prefix}${targetName}.cpp";
    my $contents = "/*
    This file is generated to inform build scripts that ${headerName} and
    ${cppName} were created for ${targetName}.idl, and prevent the build
    scripts from trying to regenerate ${headerName} and ${cppName} on every build.
*/
";
    open FH, "> ${useOutputHeadersDir}/${headerName}" or die "Cannot open ${headerName}\n";
    print FH $contents;
    close FH;

    open FH, "> ${useOutputDir}/${cppName}" or die "Cannot open ${cppName}\n";
    print FH $contents;
    close FH;
}

sub ProcessDictionaryAndEnumerationImplementedAsOverrides
{
    my ($object, $useDocument) = @_;

    foreach my $dictionary (@{$useDocument->dictionaries}) {
        if ($dictionary->extendedAttributes->{"ImplementedAs"}) {
            $dictionaryTypeImplementationNameOverrides{$dictionary->type->name} = $dictionary->extendedAttributes->{"ImplementedAs"};
        }
    }

    foreach my $enumeration (@{$useDocument->enumerations}) {
        if ($enumeration->extendedAttributes->{"ImplementedAs"}) {
            $enumTypeImplementationNameOverrides{$enumeration->type->name} = $enumeration->extendedAttributes->{"ImplementedAs"};
        }
    }
}

sub ProcessInterfaces
{
    my ($object, $useDocument, $defines, $codeGenerator) = @_;

    die "Multiple interfaces per document are not supported" if @{$useDocument->interfaces} > 1;
    my $interface = $useDocument->interfaces->[0];
    
    if ($interface->isMixin || $interface->isPartial) {
        $object->GenerateEmptyHeaderAndCpp($useDocument, $codeGenerator);
        return;
    }

    $object->ProcessInterfaceSupplementalDependencies($interface, $useDocument);
    $object->ProcessDictionaryAndEnumerationImplementedAsOverrides($useDocument);

    print "Generating $useGenerator bindings code for IDL interface \"" . $interface->type->name . "\"\n" if $verbose;
    $codeGenerator->GenerateInterface($interface, $defines, $useDocument->enumerations, $useDocument->dictionaries);
    $codeGenerator->WriteData($interface, $useOutputDir, $useOutputHeadersDir);
}

sub ProcessCallbackFunctions
{
    my ($object, $useDocument, $defines, $codeGenerator) = @_;

    die "Multiple standalone callback functions per document are not supported" if @{$useDocument->callbackFunctions} > 1;
    my $callbackFunction = $useDocument->callbackFunctions->[0];

    $object->ProcessDictionaryAndEnumerationImplementedAsOverrides($useDocument);

    print "Generating $useGenerator bindings code for IDL callback function \"" . $callbackFunction->type->name . "\"\n" if $verbose;
    $codeGenerator->GenerateCallbackFunction($callbackFunction, $useDocument->enumerations, $useDocument->dictionaries);
    $codeGenerator->WriteData($callbackFunction, $useOutputDir, $useOutputHeadersDir);
}

sub ProcessDictionaries
{
    my ($object, $useDocument, $defines, $codeGenerator) = @_;

    my $dictionary;
    my $otherDictionaries;
    if (@{$useDocument->dictionaries} == 1) {
        $dictionary = $useDocument->dictionaries->[0];
    } else {
        my $primaryDictionaryName = fileparse($targetIdlFilePath, ".idl");
        foreach my $candidate (@{$useDocument->dictionaries}) {
            if ($candidate->type->name eq $primaryDictionaryName) {
                $dictionary = $candidate;
            } else {
                push(@$otherDictionaries, $candidate);
            }
        }
        die "Multiple dictionaries per document are only supported if one matches the filename" unless $dictionary;
    }

    if ($dictionary->isPartial) {
        $object->GenerateEmptyHeaderAndCpp($useDocument, $codeGenerator);
        return;
    }

    $object->ProcessDictionarySupplementalDependencies($dictionary, $useDocument);
    $object->ProcessDictionaryAndEnumerationImplementedAsOverrides($useDocument);
    
    print "Generating $useGenerator bindings code for IDL dictionary \"" . $dictionary->type->name . "\"\n" if $verbose;
    $codeGenerator->GenerateDictionary($dictionary, $useDocument->enumerations, $otherDictionaries);
    $codeGenerator->WriteData($dictionary, $useOutputDir, $useOutputHeadersDir);
}

sub ProcessEnumerations
{
    my ($object, $useDocument, $defines, $codeGenerator) = @_;

    die "Multiple standalone enumerations per document are not supported" if @{$useDocument->enumerations} > 1;
    my $enumeration = $useDocument->enumerations->[0];

    $object->ProcessDictionaryAndEnumerationImplementedAsOverrides($useDocument);

    print "Generating $useGenerator bindings code for IDL enumeration \"" . $enumeration->type->name . "\"\n" if $verbose;
    $codeGenerator->GenerateEnumeration($enumeration);
    $codeGenerator->WriteData($enumeration, $useOutputDir, $useOutputHeadersDir);
}

sub MergeExtendedAttributesFromSupplemental
{
    my ($object, $supplementalExtendedAttributes, $property, $context) = @_;

    foreach my $extendedAttributeName (keys %{$supplementalExtendedAttributes}) {
        my $isAllowed = 0;
        for my $contextAllowed (@{$idlAttributes->{$extendedAttributeName}->{"contextsAllowed"}}) {
            if ($contextAllowed eq $context) {
                $isAllowed = 1;
                last;
            }
        }
        next unless $isAllowed;

        # FIXME: Tests currently depend on special case for Conditional overwriting non-operation cases, but this should
        # be fixed. Ultimately, this will probably mean either removing support for disjunctions for Conditional,
        # which is not used outside of the tests, or adding support for parentheses to disambiguate.
        if ($extendedAttributeName eq "Conditional" && $context ne "operation") {
            $property->extendedAttributes->{$extendedAttributeName} = $supplementalExtendedAttributes->{$extendedAttributeName};
            next;
        }

        # Handle case that the attribute already has a extented attribute with this key.
        if ($property->extendedAttributes->{$extendedAttributeName}) {
            if (!$idlAttributes->{$extendedAttributeName}->{"supportsConjunction"}) {
                die "Duplicate non-mergeable extended attribute ($extendedAttributeName) found when merging extended attributes for ${property->name}";
            }
            $property->extendedAttributes->{$extendedAttributeName} = $property->extendedAttributes->{$extendedAttributeName} . "&" . $supplementalExtendedAttributes->{$extendedAttributeName};
        } else {
            $property->extendedAttributes->{$extendedAttributeName} = $supplementalExtendedAttributes->{$extendedAttributeName};
        }
    }
}

sub IsValidSupplementalInterface
{
    my ($object, $supplementalInterface, $targetInterface, $includesMap) = @_;

    return 1 if $supplementalInterface->isPartial && $supplementalInterface->type->name eq $targetInterface->type->name;
    return 1 if $supplementalInterface->isMixin && $includesMap->{$supplementalInterface->type->name};
    return 0;
}

sub IsValidSupplementalDictionary
{
    my ($object, $supplementalDictionary, $targetDictionary) = @_;

    return 1 if $supplementalDictionary->isPartial && $supplementalDictionary->type->name eq $targetDictionary->type->name;
    return 0;
}

sub ProcessInterfaceSupplementalDependencies
{
    my ($object, $targetInterface, $targetDocument) = @_;

    return unless $supplementalDependencies;

    my $targetFileName = fileparse($targetDocument->fileName);

    # FIXME: Currently, we require all the includes statements to be in the
    # same file as the interface they are being mixed into, but that restriction
    # is artificial and we could add support for includes statements elsewhere.
    my %includesMap = ();
    foreach my $include (@{$targetDocument->includes}) {
        if ($include->interfaceIdentifier eq $targetInterface->type->name) {
            unless (grep { fileparse($_, ".idl") eq $include->mixinIdentifier } @{$supplementalDependencies->{$targetFileName}}) {
                die "included interface mixin " . $include->mixinIdentifier . " not in supplemental dependencies."
            }
            
            $includesMap{$include->mixinIdentifier} = $include;
        }
    }

    foreach my $idlFile (@{$supplementalDependencies->{$targetFileName}}) {
        next if fileparse($idlFile) eq $targetFileName;

        my $interfaceName = fileparse($idlFile, ".idl");
        my $parser = IDLParser->new(!$verbose);
        my $document = $parser->Parse($idlFile, $defines, $preprocessor, $idlAttributes);

        foreach my $interface (@{$document->interfaces}) {
            next unless $object->IsValidSupplementalInterface($interface, $targetInterface, \%includesMap);

            if ($interface->isMixin && !$interface->isPartial) {
                # Recursively process any supplemental dependencies for each valid mixin. This
                # allows partial partial interface mixins to be merged into the mixin.
                $object->ProcessInterfaceSupplementalDependencies($interface, $document);
            }

            # Support for attributes from supplemental interfaces.
            foreach my $attribute (@{$interface->attributes}) {
                next unless $targetInterface->isMixin || shouldPropertyBeExposed($attribute, $targetInterface);

                if ($interface->isMixin && !$interface->isPartial) {
                    # Add includes statement specific extended attributes to each attribute.
                    $object->MergeExtendedAttributesFromSupplemental($includesMap{$interface->type->name}->extendedAttributes, $attribute, "attribute");
                }

                # Add interface-wide extended attributes to each attribute.
                $object->MergeExtendedAttributesFromSupplemental($interface->extendedAttributes, $attribute, "attribute");

                push(@{$targetInterface->attributes}, $attribute);
            }

            # Support for operations from supplemental interfaces.
            foreach my $operation (@{$interface->operations}) {
                next unless $targetInterface->isMixin || shouldPropertyBeExposed($operation, $targetInterface);

                if ($interface->isMixin && !$interface->isPartial) {
                    # Add includes statement specific extended attributes to each operation.
                    $object->MergeExtendedAttributesFromSupplemental($includesMap{$interface->type->name}->extendedAttributes, $operation, "operation");
                }

                # Add interface-wide extended attributes to each operation.
                $object->MergeExtendedAttributesFromSupplemental($interface->extendedAttributes, $operation, "operation");
                
                push(@{$targetInterface->operations}, $operation);
            }

            # Support for constants from supplemental interfaces.
            foreach my $constant (@{$interface->constants}) {
                next unless $targetInterface->isMixin || shouldPropertyBeExposed($constant, $targetInterface);

                if ($interface->isMixin && !$interface->isPartial) {
                    # Add includes statement specific extended attributes to each operation.
                    $object->MergeExtendedAttributesFromSupplemental($includesMap{$interface->type->name}->extendedAttributes, $constant, "constant");
                }

                # Add interface-wide extended attributes to each constant.
                $object->MergeExtendedAttributesFromSupplemental($interface->extendedAttributes, $constant, "constant");

                push(@{$targetInterface->constants}, $constant);
            }
        }
    }
}

sub ProcessDictionarySupplementalDependencies
{
    my ($object, $targetDictionary, $targetDocument) = @_;

    return unless $supplementalDependencies;

    my $targetFileName = fileparse($targetDocument->fileName);
    foreach my $idlFile (@{$supplementalDependencies->{$targetFileName}}) {
        next if fileparse($idlFile) eq $targetFileName;

        my $dictionaryName = fileparse($idlFile, ".idl");
        my $parser = IDLParser->new(!$verbose);
        my $document = $parser->Parse($idlFile, $defines, $preprocessor, $idlAttributes);

        foreach my $dictionary (@{$document->dictionaries}) {
            next unless $object->IsValidSupplementalDictionary($dictionary, $targetDictionary);

            # Support for members of partial dictionaries.
            foreach my $member (@{$dictionary->members}) {
                next unless shouldPropertyBeExposed($member, $targetDictionary);

                # Add interface-wide extended attributes to each member.
                $object->MergeExtendedAttributesFromSupplemental($dictionary->extendedAttributes, $member, "dictionary-member");

                push(@{$targetDictionary->members}, $member);
            }
        }
    }
}

# Attributes / Operations / Constants of supplemental interfaces can have an [Exposed=XX] attribute which restricts
# on which global contexts they should be exposed. [Exposed=*] will expose the attribute on the interface for all
# supported global contexts.
sub shouldPropertyBeExposed
{
    my ($context, $target) = @_;

    my $exposedAttribute = $target->extendedAttributes->{"Exposed"} || "Window";
    return 1 if $exposedAttribute eq "*";

    $exposedAttribute = substr($exposedAttribute, 1, -1) if substr($exposedAttribute, 0, 1) eq "(";
    my @targetGlobalContexts = split(",", $exposedAttribute);

    my $exposed = $context->extendedAttributes->{Exposed};

    return 1 unless $exposed;

    $exposed = substr($exposed, 1, -1) if substr($exposed, 0, 1) eq "(";
    my @sourceGlobalContexts = split(",", $exposed);

    foreach my $targetGlobalContext (@targetGlobalContexts) {
        return 1 if grep(/^$targetGlobalContext$/, @sourceGlobalContexts);
    }

    return 0;
}

sub UpdateFile
{
    my $object = shift;
    my $fileName = shift;
    my $contents = shift;

    # FIXME: We should only write content if it is different from what is in the file.
    # But that would mean running more often the binding generator, see https://bugs.webkit.org/show_bug.cgi?id=131756
    open FH, ">", $fileName or die "Couldn't open $fileName: $!\n";
    print FH $contents;
    close FH;
}

sub ForAllParents
{
    my $object = shift;
    my $interface = shift;
    my $beforeRecursion = shift;
    my $afterRecursion = shift;

    my $recurse;
    $recurse = sub {
        my $outerInterface = shift;
        my $currentInterface = shift;

        if  ($currentInterface->parentType) {
            my $interfaceName = $currentInterface->parentType->name;
            my $parentInterface = $object->ParseInterface($outerInterface, $interfaceName);

            if ($beforeRecursion) {
                &$beforeRecursion($parentInterface) eq 'prune' and next;
            }
            &$recurse($outerInterface, $parentInterface);
            &$afterRecursion($parentInterface) if $afterRecursion;
        }
    };

    &$recurse($interface, $interface);
}

sub IDLFileForInterface
{
    my $object = shift;
    my $interfaceName = shift;

    unless ($idlFiles) {
        return undef unless $idlFileNamesList;
        open my $fh, "<", $idlFileNamesList or die "cannot open $idlFileNamesList for reading";
        $idlFiles = { };
        while (<$fh>) {
            chomp $_;
            my $name = fileparse($_, ".idl");
            $idlFiles->{$name} = $_;
        }
        close $fh;
    }

    return $idlFiles->{$interfaceName};
}

sub GetInterfaceForType
{
    my ($object, $currentInterface, $type) = @_;

    return undef unless $object->IsInterfaceType($type);

    return $object->ParseInterface($currentInterface, $type->name);
}

sub GetAttributeFromInterface
{
    my ($object, $outerInterface, $interfaceName, $attributeName) = @_;

    my $interface = $object->ParseInterface($outerInterface, $interfaceName);
    for my $attribute (@{$interface->attributes}) {
        return $attribute if $attribute->name eq $attributeName;
    }
    die("Could not find attribute '$attributeName' on interface '$interfaceName'.");
}

sub ParseInterface
{
    my $object = shift;
    my $outerInterface = shift;
    my $interfaceName = shift;

    return undef if $interfaceName eq 'Object';
    return undef if $interfaceName eq 'UNION';

    if (exists $cachedInterfaces->{$interfaceName}) {
        return $cachedInterfaces->{$interfaceName};
    }

    # Step #1: Find the IDL file associated with 'interface'
    my $filename = $object->IDLFileForInterface($interfaceName)
        or assert("Could NOT find IDL file for interface \"$interfaceName\", reachable from \"" . $outerInterface->type->name . "\"!\n");

    print "  |  |>  Parsing parent IDL \"$filename\" for interface \"$interfaceName\"\n" if $verbose;

    # Step #2: Parse the found IDL file (in quiet mode).
    my $parser = IDLParser->new(1);
    my $document = $parser->Parse($filename, $defines, $preprocessor, $idlAttributes);

    foreach my $interface (@{$document->interfaces}) {
        if ($interface->type->name eq $interfaceName) {
            $cachedInterfaces->{$interfaceName} = $interface;
            return $interface;
        }
    }

    die("Could NOT find interface definition for $interfaceName in $filename");
}

sub ParseType
{
    my ($object, $typeString) = @_;

    return $cachedTypes->{$typeString} if exists($cachedTypes->{$typeString});

    my $parser = IDLParser->new(1);
    my $type = $parser->ParseType($typeString, $idlAttributes);

    $cachedTypes->{$typeString} = $type;

    return $type;
}

# Helpers for all CodeGenerator***.pm modules

sub IsNumericType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return 1 if $integerTypeHash{$type->name};
    return 1 if $floatingPointTypeHash{$type->name};
    return 0;
}

sub IsStringOrEnumType
{
    my ($object, $type) = @_;
    
    assert("Not a type") if ref($type) ne "IDLType";

    return 1 if $object->IsStringType($type);
    return 1 if $object->IsEnumType($type);
    return 0;
}

sub IsIntegerType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return 1 if $integerTypeHash{$type->name};
    return 0;
}

sub IsFloatingPointType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return 1 if $floatingPointTypeHash{$type->name};
    return 0;
}

sub IsPrimitiveType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return 1 if $primitiveTypeHash{$type->name};
    return 1 if $object->IsNumericType($type);
    return 0;
}

sub IsStringType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return 1 if $stringTypeHash{$type->name};
    return 0;
}

sub IsEnumType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return defined($object->GetEnumByType($type));
}

sub GetEnumByType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    my $name = $type->name;

    die "GetEnumByType() was called with an undefined enumeration name" unless defined($name);

    for my $enumeration (@{$useDocument->enumerations}) {
        return $enumeration if $enumeration->type->name eq $name;
    }

    return $cachedExternalEnumerations->{$name} if exists($cachedExternalEnumerations->{$name});

    # Find the IDL file associated with the dictionary.
    my $filename = $object->IDLFileForInterface($name) or return;

    # Do a fast check to see if it seems to contain a dictionary.
    my $fileContents = slurp($filename);

    if ($fileContents =~ /\benum\s+$name/gs) {
        # Parse the IDL.
        my $parser = IDLParser->new(1);
        my $document = $parser->Parse($filename, $defines, $preprocessor, $idlAttributes);

        foreach my $enumeration (@{$document->enumerations}) {
            next unless $enumeration->type->name eq $name;

            $cachedExternalEnumerations->{$name} = $enumeration;
            my $implementedAs = $enumeration->extendedAttributes->{ImplementedAs};
            $enumTypeImplementationNameOverrides{$enumeration->type->name} = $implementedAs if $implementedAs;
            return $enumeration;
        }
    }
    $cachedExternalEnumerations->{$name} = undef;
}

# An enumeration defined in its own IDL file.
sub IsExternalEnumType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $object->IsEnumType($type) && defined($cachedExternalEnumerations->{$type->name});
}

sub HasEnumImplementationNameOverride
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return 1 if exists $enumTypeImplementationNameOverrides{$type->name};
    return 0;
}

sub GetEnumImplementationNameOverride
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $enumTypeImplementationNameOverrides{$type->name};
}

sub GetDictionaryByType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    my $name = $type->name;

    die "GetDictionaryByType() was called with an undefined dictionary name" unless defined($name);

    for my $dictionary (@{$useDocument->dictionaries}) {
        return $dictionary if $dictionary->type->name eq $name;
    }

    return $cachedExternalDictionaries->{$name} if exists($cachedExternalDictionaries->{$name});

    # Find the IDL file associated with the dictionary.
    my $filename = $object->IDLFileForInterface($name) or return;

    # Do a fast check to see if it seems to contain a dictionary.
    my $fileContents = slurp($filename);

    if ($fileContents =~ /\bdictionary\s+$name/gs) {
        # Parse the IDL.
        my $parser = IDLParser->new(1);
        my $document = $parser->Parse($filename, $defines, $preprocessor, $idlAttributes);

        foreach my $dictionary (@{$document->dictionaries}) {
            if ($dictionary->type->name eq $name) {
                $object->ProcessDictionarySupplementalDependencies($dictionary, $document);

                $cachedExternalDictionaries->{$name} = $dictionary;
                my $implementedAs = $dictionary->extendedAttributes->{ImplementedAs};
                $dictionaryTypeImplementationNameOverrides{$name} = $implementedAs if $implementedAs;
                return $dictionary;
            }
        }
    }
    $cachedExternalDictionaries->{$name} = undef;
}

sub IsDictionaryType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $type->name =~ /^[A-Z]/ && defined($object->GetDictionaryByType($type));
}

# A dictionary defined in its own IDL file.
sub IsExternalDictionaryType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $object->IsDictionaryType($type) && defined($cachedExternalDictionaries->{$type->name});
}

sub HasDictionaryImplementationNameOverride
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return 1 if exists $dictionaryTypeImplementationNameOverrides{$type->name};
    return 0;
}

sub GetDictionaryImplementationNameOverride
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $dictionaryTypeImplementationNameOverrides{$type->name};
}

sub IsSVGAnimatedTypeName
{
    my ($object, $typeName) = @_;

    return $typeName =~ /^SVGAnimated/;
}

sub IsSVGAnimatedType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $object->IsSVGAnimatedTypeName($type->name);
}

sub IsSVGPathSegTypeName
{
    my ($object, $typeName) = @_;

    return $typeName =~ /^SVGPathSeg/;
}

sub IsSVGPathSegType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $object->IsSVGPathSegTypeName($type->name);
}

sub IsConstructorType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $type->name =~ /Constructor$/;
}

sub IsEventHandlerType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $type->name =~ /EventHandler$/;
}

sub IsSequenceType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $type->name eq "sequence";
}

sub IsFrozenArrayType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $type->name eq "FrozenArray";
}

sub IsSequenceOrFrozenArrayType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $object->IsSequenceType($type) || $object->IsFrozenArrayType($type);
}

sub IsRecordType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $type->name eq "record";
}

sub IsBufferSourceType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return 1 if $bufferSourceTypes{$type->name};
    return 0;
}

sub IsPromiseType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $type->name eq "Promise";
}

# These match WK_lcfirst and WK_ucfirst defined in builtins_generator.py.
# Uppercase the first letter while respecting WebKit style guidelines.
# E.g., xmlEncoding becomes XMLEncoding, but xmlllang becomes Xmllang.
sub WK_ucfirst
{
    my ($object, $param) = @_;

    my $ret = ucfirst($param);
    $ret =~ s/Xml/XML/ if $ret =~ /^Xml[^a-z]/;
    $ret =~ s/Svg/SVG/ if $ret =~ /^Svg/;
    $ret =~ s/Srgb/SRGB/ if $ret =~ /^Srgb/;
    $ret =~ s/Cenc/cenc/ if $ret =~ /^Cenc/;
    $ret =~ s/Cbcs/cbcs/ if $ret =~ /^Cbcs/;
    $ret =~ s/Pq/PQ/ if $ret =~ /^Pq$/;
    $ret =~ s/Hlg/HLG/ if $ret =~ /^Hlg/;
    $ret =~ s/Ios/iOS/ if $ret =~ /^Ios/;
    $ret =~ s/Hls/HLS/ if $ret =~ /^Hls/;

    return $ret;
}

# Lowercase the first letter while respecting WebKit style guidelines.
# URL becomes url, but SetURL becomes setURL.
sub WK_lcfirst
{
    my ($object, $param) = @_;

    my $ret = lcfirst($param);
    $ret =~ s/dOM/dom/ if $ret =~ /^dOM/;
    $ret =~ s/hTML/html/ if $ret =~ /^hTML/;
    $ret =~ s/uRL/url/ if $ret =~ /^uRL/;
    $ret =~ s/jS/js/ if $ret =~ /^jS/;
    $ret =~ s/xML/xml/ if $ret =~ /^xML/;
    $ret =~ s/xSLT/xslt/ if $ret =~ /^xSLT/;
    $ret =~ s/cSS/css/ if $ret =~ /^cSS/;
    $ret =~ s/rTC/rtc/ if $ret =~ /^rTC/;

    # For HTML5 FileSystem API Flags attributes.
    # (create is widely used to instantiate an object and must be avoided.)
    $ret =~ s/^create/isCreate/ if $ret =~ /^create$/;
    $ret =~ s/^exclusive/isExclusive/ if $ret =~ /^exclusive$/;

    return $ret;
}

sub slurp
{
    my $file = shift;

    open my $fh, '<', $file or die;
    local $/ = undef;
    my $content = <$fh>;
    close $fh;
    return $content;
}

sub trim
{
    my $string = shift;

    $string =~ s/^\s+|\s+$//g;
    return $string;
}

# Return the C++ namespace that a given attribute name string is defined in.
sub NamespaceForAttributeName
{
    my ($object, $interfaceName, $attributeName) = @_;

    return "SVGNames" if $interfaceName =~ /^SVG/ && !$svgAttributesInHTMLHash{$attributeName};
    return "HTMLNames";
}

# Identifies overloaded functions and for each function adds an array with
# links to its respective overloads (including itself).
sub LinkOverloadedOperations
{
    my ($object, $interface) = @_;

    my %nameToRegularOperationsMap = ();
    my %nameToStaticOperationsMap = ();
    foreach my $operation (@{$interface->operations}) {
        my $name = $operation->name;
        if ($operation->isStatic) {
            $nameToStaticOperationsMap{$name} = [] if !exists $nameToStaticOperationsMap{$name};
            push(@{$nameToStaticOperationsMap{$name}}, $operation);
            $operation->{overloads} = $nameToStaticOperationsMap{$name};
            $operation->{overloadIndex} = @{$nameToStaticOperationsMap{$name}};
        } else {
            $nameToRegularOperationsMap{$name} = [] if !exists $nameToRegularOperationsMap{$name};
            push(@{$nameToRegularOperationsMap{$name}}, $operation);
            $operation->{overloads} = $nameToRegularOperationsMap{$name};
            $operation->{overloadIndex} = @{$nameToRegularOperationsMap{$name}};
        }
    }

    my $index = 1;
    foreach my $constructor (@{$interface->constructors}) {
        $constructor->{overloads} = $interface->constructors;
        $constructor->{overloadIndex} = $index;
        $index++;
    }
}

sub AttributeNameForGetterAndSetter
{
    my ($generator, $attribute) = @_;

    my $attributeName = $attribute->name;
    if ($attribute->extendedAttributes->{"ImplementedAs"}) {
        $attributeName = $attribute->extendedAttributes->{"ImplementedAs"};
    }
    my $attributeType = $attribute->type;

    # SVG animated types need to use a special attribute name.
    # The rest of the special casing for SVG animated types is handled in the language-specific code generators.
    $attributeName .= "Animated" if $generator->IsSVGAnimatedType($attributeType);

    return $attributeName;
}

sub ContentAttributeName
{
    my ($generator, $implIncludes, $interfaceName, $attribute) = @_;

    my $contentAttributeName = $attribute->extendedAttributes->{"Reflect"};
    return undef if !$contentAttributeName;

    $contentAttributeName = lc $generator->AttributeNameForGetterAndSetter($attribute) if $contentAttributeName eq "VALUE_IS_MISSING";

    my $namespace = $generator->NamespaceForAttributeName($interfaceName, $contentAttributeName);

    $implIncludes->{"${namespace}.h"} = 1;
    return "WebCore::${namespace}::${contentAttributeName}Attr";
}

sub GetterExpression
{
    my ($generator, $implIncludes, $interfaceName, $attribute) = @_;

    my $contentAttributeName = $generator->ContentAttributeName($implIncludes, $interfaceName, $attribute);

    if (!$contentAttributeName) {
        return ($generator->WK_lcfirst($generator->AttributeNameForGetterAndSetter($attribute)));
    }

    my $attributeType = $attribute->type;

    my $functionName;
    if ($attribute->extendedAttributes->{"URL"}) {
        $implIncludes->{"ElementInlines.h"} = 1;
        $functionName = "getURLAttributeForBindings";
    } elsif ($attributeType->name eq "boolean") {
        $implIncludes->{"ElementInlines.h"} = 1;
        $functionName = "hasAttributeWithoutSynchronization";
    } elsif ($attributeType->name eq "long") {
        $functionName = "getIntegralAttribute";
    } elsif ($attributeType->name eq "unsigned long") {
        $functionName = "getUnsignedIntegralAttribute";
    } elsif ($attributeType->name eq "Element") {
        $functionName = "getElementAttribute";
    } elsif ($attributeType->name eq "FrozenArray" && scalar @{$attributeType->subtypes} == 1 && @{$attributeType->subtypes}[0]->name eq "Element") {
        $functionName = "getElementsArrayAttribute";
    } else {
        if ($contentAttributeName eq "WebCore::HTMLNames::idAttr") {
            $functionName = "getIdAttribute";
            $contentAttributeName = "";
        } elsif ($contentAttributeName eq "WebCore::HTMLNames::nameAttr") {
            $implIncludes->{"ElementInlines.h"} = 1;
            $functionName = "getNameAttribute";
            $contentAttributeName = "";
        } elsif ($generator->IsSVGAnimatedType($attributeType)) {
            $functionName = "getAttribute";
        } else {
            $implIncludes->{"ElementInlines.h"} = 1;
            $functionName = "attributeWithoutSynchronization";
        }
    }

    return ($functionName, $contentAttributeName);
}

sub SetterExpression
{
    my ($generator, $implIncludes, $interfaceName, $attribute) = @_;

    my $contentAttributeName = $generator->ContentAttributeName($implIncludes, $interfaceName, $attribute);

    if (!$contentAttributeName) {
        return ("set" . $generator->WK_ucfirst($generator->AttributeNameForGetterAndSetter($attribute)));
    }

    my $attributeType = $attribute->type;

    my $functionName;
    if ($attributeType->name eq "boolean") {
        $functionName = "setBooleanAttribute";
    } elsif ($attributeType->name eq "long") {
        $functionName = "setIntegralAttribute";
    } elsif ($attributeType->name eq "unsigned long") {
        $functionName = "setUnsignedIntegralAttribute";
    } elsif ($attributeType->name eq "Element") {
        $functionName = "setElementAttribute";
    } elsif ($attributeType->name eq "FrozenArray" && scalar @{$attributeType->subtypes} == 1 && @{$attributeType->subtypes}[0]->name eq "Element") {
        $functionName = "setElementsArrayAttribute";
    } elsif ($generator->IsSVGAnimatedType($attributeType)) {
        $functionName = "setAttribute";
    } else {
        $functionName = "setAttributeWithoutSynchronization";
    }

    return ($functionName, $contentAttributeName);
}

sub IsBuiltinType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return 1 if $object->IsPrimitiveType($type);
    return 1 if $object->IsSequenceOrFrozenArrayType($type);
    return 1 if $object->IsRecordType($type);
    return 1 if $object->IsStringType($type);
    return 1 if $object->IsBufferSourceType($type);
    return 1 if $type->isUnion;
    return 1 if $type->name eq "EventListener";
    return 1 if $type->name eq "JSON";
    return 1 if $type->name eq "Promise";
    return 1 if $type->name eq "ScheduledAction";
    return 1 if $type->name eq "SerializedScriptValue";
    return 1 if $type->name eq "any";
    return 1 if $type->name eq "object";

    return 0;
}

sub IsInterfaceType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return 0 if $object->IsBuiltinType($type);
    return 0 if $object->IsDictionaryType($type);
    return 0 if $object->IsEnumType($type);

    return 1;
}

sub IsWrapperType
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return 1 if $object->IsInterfaceType($type);

    return 0;
}

sub InterfaceHasRegularToJSONOperation
{
    my ($object, $interface) = @_;

    foreach my $operation (@{$interface->operations}) {
        if (!$operation->isStatic && $operation->name eq "toJSON") {
            return 1;
        }
    }
    return 0;
}

# https://webidl.spec.whatwg.org/#dfn-json-types
sub IsJSONType
{
    my ($object, $interface, $type) = @_;

    return 1 if $type->name eq "object";
    return 1 if $type->name eq "boolean";
    return 1 if $object->IsNumericType($type);
    return 1 if $object->IsStringOrEnumType($type);

    if ($object->IsSequenceOrFrozenArrayType($type)) {
        my $subtype = @{$type->subtypes}[0];
        return $object->IsJSONType($interface, $subtype);
    }
    if ($object->IsRecordType($type)) {
        my $valueSubtype = @{$type->subtypes}[0];
        return $object->IsJSONType($interface, $valueSubtype);
    }

    if ($object->IsInterfaceType($type)) {
        # Special case EventHandler, since there is no real IDL for it.
        return 0 if $object->IsEventHandlerType($type);

        my $interface = $object->GetInterfaceForType($interface, $type);
        if ($object->InterfaceHasRegularToJSONOperation($interface)) {
            return 1;
        }

        my $anyParentHasRegularToJSONOperation = 0;
        $object->ForAllParents($interface, sub {
            my $parentInterface = shift;
            $anyParentHasRegularToJSONOperation = 1 if $object->InterfaceHasRegularToJSONOperation($parentInterface);
        }, 0);
        
        if ($anyParentHasRegularToJSONOperation) {
            return 1;
        }
    }
    
    if ($type->isUnion) {
        # FIXME: Union types should be supported if all the member types are JSON types.
        die "Default toJSON is currently not supported for union types.\n";
    }
    if ($object->IsDictionaryType($type)) {
        # FIXME: Dictionary types should be supported if all members declared on the dictionary and all its inherited dictionaries are JSON types.
        die "Default toJSON is currently not supported for dictionary types.\n";
    }

    return 0;
}

sub hasCachedAttributeOrCustomGetterExtendedAttribute
{
    my ($attribute) = @_;
    return $attribute->extendedAttributes->{CachedAttribute} || $attribute->extendedAttributes->{CustomGetter};
}

sub GetInterfaceExtendedAttributesFromName
{
    # FIXME: It's bad to have a function like this that opens another IDL file to answer a question.
    # Overusing this kind of function can make things really slow. Lets avoid these if we can.
    # To mitigate that, lets cache what we learn in a hash so we don't open the same file over and over.

    my ($object, $interfaceName) = @_;

    my $idlFile = $object->IDLFileForInterface($interfaceName) or assert("Could NOT find IDL file for interface \"$interfaceName\"!\n");

    return $cachedExtendedAttributes->{$idlFile} if exists $cachedExtendedAttributes->{$idlFile};

    my $extendedAttributes = {};

    my $fileContents = slurp($idlFile);
    if ($fileContents =~ /\[(.*)\]\s+(callback interface|interface)\s+(\w+)/gs) {
        my @parts = split(',', $1);
        foreach my $part (@parts) {
            my @keyValue = split('=', $part);
            my $key = trim($keyValue[0]);
            next unless length($key);
            my $value = "VALUE_IS_MISSING";
            $value = trim($keyValue[1]) if @keyValue > 1;
            $extendedAttributes->{$key} = $value;
        }
        $cachedExtendedAttributes->{$idlFile} = $extendedAttributes;
        return $extendedAttributes;
    }
    $cachedExtendedAttributes->{$idlFile} = undef;
}

sub ComputeIsCallbackInterface
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return 0 unless $object->IsInterfaceType($type);
    return 0 if $type->name eq "WindowProxy";

    my $typeName = $type->name;
    my $idlFile = $object->IDLFileForInterface($typeName) or assert("Could NOT find IDL file for interface \"$typeName\"!\n");

    my $fileContents = slurp($idlFile);
    return ($fileContents =~ /callback\s+interface\s+(\w+)/gs);
}

my %isCallbackInterface = ();

sub IsCallbackInterface
{
    # FIXME: It's bad to have a function like this that opens another IDL file to answer a question.
    # Overusing this kind of function can make things really slow. Lets avoid these if we can.
    # To mitigate that, lets cache what we learn in a hash so we don't open the same file over and over.

    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $isCallbackInterface{$type->name} if exists $isCallbackInterface{$type->name};
    my $result = $object->ComputeIsCallbackInterface($type);
    $isCallbackInterface{$type->name} = $result;
    return $result;
}

sub ComputeIsCallbackFunction
{
    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return 0 unless $object->IsInterfaceType($type);
    return 0 if $type->name eq "WindowProxy";

    my $typeName = $type->name;
    my $idlFile = $object->IDLFileForInterface($typeName) or assert("Could NOT find IDL file for interface \"$typeName\"!\n");

    my $fileContents = slurp($idlFile);
    return ($fileContents =~ /(.*)callback\s+(\w+)\s+=/gs);
}

my %isCallbackFunction = ();

sub IsCallbackFunction
{
    # FIXME: It's bad to have a function like this that opens another IDL file to answer a question.
    # Overusing this kind of function can make things really slow. Lets avoid these if we can.
    # To mitigate that, lets cache what we learn in a hash so we don't open the same file over and over.

    my ($object, $type) = @_;

    assert("Not a type") if ref($type) ne "IDLType";

    return $isCallbackFunction{$type->name} if exists $isCallbackFunction{$type->name};
    my $result = $object->ComputeIsCallbackFunction($type);
    $isCallbackFunction{$type->name} = $result;
    return $result;
}

sub GenerateConditionalString
{
    my ($generator, $node) = @_;

    my $conditional = $node->extendedAttributes->{"Conditional"};
    if ($conditional) {
        return $generator->GenerateConditionalStringFromAttributeValue($conditional);
    } else {
        return "";
    }
}

sub GenerateConditionalStringFromAttributeValue
{
    my ($generator, $conditional) = @_;

    my %disjunction;
    map {
        my $expression = $_;
        my %conjunction;
        map { $conjunction{$_} = 1; } split(/&/, $expression);
        $expression = "ENABLE(" . join(") && ENABLE(", sort keys %conjunction) . ")";
        $disjunction{$expression} = 1
    } split(/\|/, $conditional);

    return "1" if keys %disjunction == 0;
    return (%disjunction)[0] if keys %disjunction == 1;

    my @parenthesized;
    map {
        my $expression = $_;
        $expression = "($expression)" if $expression =~ / /;
        push @parenthesized, $expression;
    } sort keys %disjunction;

    return join(" || ", @parenthesized);
}

sub GenerateCompileTimeCheckForEnumsIfNeeded
{
    my ($generator, $interface) = @_;

    return () if $interface->extendedAttributes->{"DoNotCheckConstants"} || !@{$interface->constants};

    my $enum = $interface->extendedAttributes->{"ConstantsEnum"};
    my $baseScope = $enum || $interface->extendedAttributes->{"ConstantsScope"} || $interface->type->name;

    my @checks = ();
    foreach my $constant (@{$interface->constants}) {
        my $scope = $constant->extendedAttributes->{"ImplementedBy"} || $baseScope;
        my $name = $constant->extendedAttributes->{"ImplementedAs"} || $constant->name;
        my $value = $enum ? "static_cast<" . $enum . ">(" . $constant->value . ")" : $constant->value;
        my $conditional = $constant->extendedAttributes->{"Conditional"};
        push(@checks, "#if " . $generator->GenerateConditionalStringFromAttributeValue($conditional) . "\n") if $conditional;
        push(@checks, "static_assert(${scope}::${name} == ${value}, \"${name} in ${scope} does not match value from IDL\");\n");
        push(@checks, "#endif\n") if $conditional;
    }
    push(@checks, "\n");
    return @checks;
}

sub ExtendedAttributeContains
{
    my $object = shift;
    my $extendedAttribute = shift;
    return 0 unless $extendedAttribute;
    my $keyword = shift;

    my @extendedAttributeKeywords = split /\s*\&\s*/, $extendedAttribute;
    return grep { /$keyword/ } @extendedAttributeKeywords if ref($keyword) eq "Regexp";
    return grep { $_ eq $keyword } @extendedAttributeKeywords;
}

# FIXME: This is backwards. We currently name the interface and the IDL files with the implementation name. We
# should use the real interface name in the IDL files and then use ImplementedAs to map this to the implementation name.
sub GetVisibleInterfaceName
{
    my ($object, $interface) = @_;

    my $interfaceName = $interface->extendedAttributes->{"InterfaceName"};
    return $interfaceName ? $interfaceName : $interface->type->name;
}

sub InheritsInterface
{
    my ($object, $interface, $interfaceName) = @_;

    return 1 if $interfaceName eq $interface->type->name;

    my $found = 0;
    $object->ForAllParents($interface, sub {
        my $currentInterface = shift;
        if ($currentInterface->type->name eq $interfaceName) {
            $found = 1;
        }
        return 1 if $found;
    }, 0);

    return $found;
}

sub InheritsExtendedAttribute
{
    my ($object, $interface, $extendedAttribute) = @_;

    return 1 if $interface->extendedAttributes->{$extendedAttribute};

    my $found = 0;
    $object->ForAllParents($interface, sub {
        my $currentInterface = shift;
        if ($currentInterface->extendedAttributes->{$extendedAttribute}) {
            $found = 1;
        }
        return 1 if $found;
    }, 0);

    return $found;
}


1;
