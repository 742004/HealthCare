export const emergencyFallbackKnowledge = {
  "heart attack": `A suspected heart attack is a medical emergency.

• Call your local emergency medical service immediately.
• Do not drive yourself if emergency transport is available.
• Sit and rest while waiting for professional help.
• If the person becomes unconscious and is not breathing normally, follow emergency dispatcher instructions and begin CPR if trained.
• Use an AED if available and follow its instructions.

Do not delay emergency medical care while waiting for an AI response.
This information is general emergency guidance and is not a diagnosis.`,

  "stroke": `A suspected stroke is a medical emergency. Remember FAST:

• Face: Ask the person to smile. Does one side droop?
• Arms: Ask them to raise both arms. Does one drift downward?
• Speech: Ask them to repeat a simple phrase. Is their speech slurred?
• Time: Call emergency services immediately.

Do not delay emergency medical care while waiting for an AI response.
This information is general emergency guidance and is not a diagnosis.`,

  "bleeding": `Severe bleeding is a medical emergency.

• Call emergency medical services immediately.
• Apply firm, direct pressure to the wound with a clean cloth or bandage.
• Do not remove the cloth if it soaks through; add more layers on top and maintain pressure.
• If on a limb and pressure doesn't stop it, consider a tourniquet if trained.
• Keep the person lying down and warm to prevent shock.

Do not delay emergency medical care while waiting for an AI response.
This information is general emergency guidance.`,

  "unconscious": `An unconscious person requires immediate attention.

• Check if they are breathing.
• Call emergency medical services immediately.
• If they are NOT breathing normally, start CPR if trained and find an AED.
• If they ARE breathing, roll them onto their side (recovery position) to keep the airway clear, unless you suspect a spinal injury.
• Do not give them anything by mouth.

Do not delay emergency medical care while waiting for an AI response.`,

  "breathing": `Severe difficulty breathing is a medical emergency.

• Call emergency medical services immediately.
• Help the person sit in a comfortable position, usually upright or leaning slightly forward.
• Loosen any tight clothing.
• If they have prescribed medication like an asthma inhaler, help them use it.
• Keep them calm.

Do not delay emergency medical care while waiting for an AI response.`,

  "choking": `Choking is a life-threatening emergency.

• Call emergency services immediately or have someone else call.
• If the person is coughing forcefully, encourage them to keep coughing.
• If they cannot breathe, speak, or cough, perform the Heimlich maneuver (abdominal thrusts).
• If they become unconscious, lower them to the ground and begin CPR, checking the mouth for the object before rescue breaths.

This information is general emergency guidance.`,

  "allergic": `A severe allergic reaction (anaphylaxis) is a medical emergency.

• Call emergency medical services immediately.
• If the person has an epinephrine auto-injector (EpiPen), help them use it right away.
• Have them lie down with their legs elevated if possible.
• Loosen tight clothing and keep them warm.
• If they vomit or have trouble breathing, roll them on their side.

Do not delay emergency medical care while waiting for an AI response.`,

  "seizure": `For someone having a seizure:

• Protect them from injury by clearing the area of hard or sharp objects.
• Cushion their head.
• Do NOT hold them down or try to stop their movements.
• Do NOT put anything in their mouth.
• Once the seizure stops, roll them onto their side to keep their airway open.
• Call emergency services if the seizure lasts more than 5 minutes, if they have difficulty breathing afterwards, or if it is their first seizure.

This information is general emergency guidance.`,

  "burn": `For minor to moderate burns:
• Cool the burn under cool (not cold) running water for at least 10-20 minutes.
• Do not use ice, butter, or ointments immediately.
• Cover loosely with sterile gauze or a clean, dry cloth.

For SEVERE burns (large area, deep, or on face/hands/genitals):
• Call emergency medical services immediately.
• Do not remove clothing stuck to the burn.
• Do not immerse large severe burns in cold water (can cause shock).

This information is general emergency guidance.`,

  "fracture": `For a suspected bone fracture:

• Call emergency medical services if the injury involves the head, neck, back, or if bone is piercing the skin.
• Do not attempt to realign the bone.
• Immobilize the injured area.
• Apply an ice pack wrapped in a cloth to reduce swelling.
• Treat for shock if necessary (keep them warm and lying down).

This information is general emergency guidance.`,

  "head injury": `For a severe head injury:

• Call emergency medical services immediately.
• Keep the person completely still. Do not move their head or neck.
• Stop any bleeding by applying firm pressure with a clean cloth (do not apply pressure if you suspect a skull fracture).
• Monitor breathing and alertness.

Do not delay emergency medical care while waiting for an AI response.`,

  "poisoning": `For suspected poisoning:

• Call your local poison control center or emergency medical services immediately.
• Have the poison container or name ready if possible.
• Do NOT try to induce vomiting unless instructed to do so by a professional.
• If the person is unconscious or having difficulty breathing, call emergency services right away.

This information is general emergency guidance.`
};

export const getEmergencyFallback = (message) => {
  const lowerMsg = message.toLowerCase();
  for (const [key, value] of Object.entries(emergencyFallbackKnowledge)) {
    if (lowerMsg.includes(key)) {
      return value;
    }
  }
  return null;
};
