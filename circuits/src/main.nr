use dep::keccak256;

// The circuit verifies that the user knows a guess whose double hash matches the stored answer hash
// guess_hash_bytes: private input - the keccak256 hash of the guess (32 bytes)
// answer_double_hash: public input - keccak256(keccak256(answer)) stored on-chain (32 bytes)  
// address: public input - the player's address (for binding proof to player)

fn main(
    guess_hash_bytes: [u8; 32],           // Private: keccak256(guess) as bytes
    answer_double_hash: pub [u8; 32],     // Public: expected keccak256(keccak256(answer))
    address: pub Field                     // Public: player's ethereum address
) {
    // Compute double hash: keccak256(guess_hash_bytes)
    let computed_double_hash: [u8; 32] = keccak256::keccak256(guess_hash_bytes, 32);

    // Verify the computed double hash matches the expected answer double hash
    for i in 0..32 {
        assert(computed_double_hash[i] == answer_double_hash[i]);
    }

    // Bind proof to address (prevent proof replay by different users)
    // This is a simple check that address is non-zero
    assert(address != 0);
}

// #[test]
// fn test_main() {
//     main(1, 2);

//     // Uncomment to make test fail
//     // main(1, 1);
// }
