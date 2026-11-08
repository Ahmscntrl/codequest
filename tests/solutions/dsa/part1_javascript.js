// Reference solutions for DSA part 1 (js/dsa/part1.js) in javascript. Used by the tests only.
module.exports = {
  dsa_arrays1: "function findIndex(items, target) {\n  for (let i = 0; i < items.length; i++) {\n    if (items[i] === target) {\n      return i;\n    }\n  }\n  return -1;\n}\n\nconsole.log(findIndex([4, 8, 15, 16, 23], 15));\n",
  dsa_arrays2: "function minMax(nums) {\n  let smallest = nums[0];\n  let largest = nums[0];\n  for (const n of nums) {\n    if (n < smallest) smallest = n;\n    if (n > largest) largest = n;\n  }\n  return [smallest, largest];\n}\n\nconsole.log(minMax([3, 9, 1, 7]));\n",
  dsa_arrays3: "function reverseInPlace(nums) {\n  let left = 0;\n  let right = nums.length - 1;\n  while (left < right) {\n    const temp = nums[left];\n    nums[left] = nums[right];\n    nums[right] = temp;\n    left++;\n    right--;\n  }\n  return nums;\n}\n\nconsole.log(reverseInPlace([1, 2, 3, 4, 5]));\n",
  dsa_arrays4: "function isPalindrome(word) {\n  let left = 0;\n  let right = word.length - 1;\n  while (left < right) {\n    if (word[left] !== word[right]) return false;\n    left++;\n    right--;\n  }\n  return true;\n}\n\nconsole.log(isPalindrome(\"racecar\"));\nconsole.log(isPalindrome(\"lever\"));\n",
  dsa_arrays5: "function pairSum(nums, target) {\n  let left = 0;\n  let right = nums.length - 1;\n  while (left < right) {\n    const total = nums[left] + nums[right];\n    if (total === target) return [nums[left], nums[right]];\n    if (total < target) left++;\n    else right--;\n  }\n  return [];\n}\n\nconsole.log(pairSum([2, 4, 7, 11, 15], 18));\n",
};
