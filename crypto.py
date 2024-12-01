from bech32 import bech32_encode, convertbits


def raw_to_bech32(raw_address, prefix='stake_test'):
    # Convert hex to bytes
    raw_bytes = bytes.fromhex(raw_address)
    # Convert 8-bit binary data to 5-bit binary (as required by Bech32)
    bech32_data = convertbits(raw_bytes, 8, 5)
    # Encode with Bech32
    bech32_address = bech32_encode(prefix, bech32_data)
    return bech32_address
