// Reference solutions for DSA part 1 (js/dsa/part1.js) in python. Used by the tests only.
module.exports = {
  dsa_arrays1: "def find_index(items, target):\n    for i in range(len(items)):\n        if items[i] == target:\n            return i\n    return -1\n\nprint(find_index([4, 8, 15, 16, 23], 15))\n",
  dsa_arrays2: "def min_max(nums):\n    smallest = nums[0]\n    largest = nums[0]\n    for n in nums:\n        if n < smallest:\n            smallest = n\n        if n > largest:\n            largest = n\n    return [smallest, largest]\n\nprint(min_max([3, 9, 1, 7]))\n",
  dsa_arrays3: "def reverse_in_place(nums):\n    left = 0\n    right = len(nums) - 1\n    while left < right:\n        nums[left], nums[right] = nums[right], nums[left]\n        left += 1\n        right -= 1\n    return nums\n\nprint(reverse_in_place([1, 2, 3, 4, 5]))\n",
  dsa_arrays4: "def is_palindrome(word):\n    left = 0\n    right = len(word) - 1\n    while left < right:\n        if word[left] != word[right]:\n            return False\n        left += 1\n        right -= 1\n    return True\n\nprint(is_palindrome(\"racecar\"))\nprint(is_palindrome(\"lever\"))\n",
  dsa_arrays5: "def pair_sum(nums, target):\n    left = 0\n    right = len(nums) - 1\n    while left < right:\n        total = nums[left] + nums[right]\n        if total == target:\n            return [nums[left], nums[right]]\n        if total < target:\n            left += 1\n        else:\n            right -= 1\n    return []\n\nprint(pair_sum([2, 4, 7, 11, 15], 18))\n",
};
