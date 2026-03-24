"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FormStep1Props {
  onNext: (data: {
    name: string;
    contact: string;
    email: string;
    eventType: string;
    gameType: string;
    gameMode: string;
    teamSize: string;
    collegeName: string;
    teamName?: string;
    referedBy?: string;
  }) => void;
  isLoading: boolean;
}

export function FormStep1({ onNext, isLoading }: FormStep1Props) {
  const [formData, setFormData] = useState({
    eventType: "",
    gameType: "",
    gameMode: "",
    teamSize: "1",
    collegeName: "",
    teamName: "",
    referedBy: "",
    members: [{ name: "", contact: "", email: "" }], // Captain is members[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.eventType) newErrors.eventType = "Event Type is required";
    if (formData.eventType === "BattleGrid" && !formData.gameType)
      newErrors.gameType = "Game is required for BattleGrid";
    if (formData.eventType === "BattleGrid" && (formData.gameType === "Freefire" || formData.gameType === "BGMI") && !formData.gameMode)
      newErrors.gameMode = "Mode is required for Freefire/BGMI";

    if (!formData.collegeName.trim())
      newErrors.collegeName = "College Name is required";

    if (formData.eventType && !formData.teamName.trim())
      newErrors.teamName = "Team Name is required";

    formData.members.forEach(
      (
        member: { name: string; contact: string; email: string },
        index: number,
      ) => {
        if (!member.name.trim()) {
          newErrors[`name_${index}`] = "Name is required";
        }

        if (!member.contact.trim()) {
          newErrors[`contact_${index}`] = "Contact is required";
        } else if (!/^\+?[0-9]{7,}$/.test(member.contact.replace(/\s/g, ""))) {
          newErrors[`contact_${index}`] = "Please enter a valid contact number";
        }

        if (!member.email.trim()) {
          newErrors[`email_${index}`] = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
          newErrors[`email_${index}`] = "Please enter a valid email";
        }
      },
    );

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMemberChange = (index: number, field: string, value: string) => {
    const newMembers = [...formData.members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setFormData({ ...formData, members: newMembers });
    if (errors[`${field}_${index}`]) {
      setErrors({ ...errors, [`${field}_${index}`]: "" });
    }
  };

  const handleEventTypeChange = (eventType: string) => {
    if (eventType === "BattleGrid") {
      setFormData({
        ...formData,
        eventType,
        gameType: "",
        gameMode: "",
        teamSize: "",
        members: [],
      });
      setErrors({});
      return;
    }

    const defaultSize =
      eventType === "CineQuest" || eventType === "Innovex" ? 2 :
      eventType === "Contentflux" || eventType === "Geovoyager" ? 2 :
      eventType === "Spiral" ? 2 :
      1;
    const defaultMembers = Array.from({ length: defaultSize }, () => ({ name: "", contact: "", email: "" }));
    setFormData({
      ...formData,
      eventType,
      gameType: "",
      gameMode: "",
      teamSize: defaultSize.toString(),
      teamName: "",
      referedBy: "",
      members: defaultMembers,
    });
    setErrors({});
  };

  const handleGameTypeChange = (gameType: string) => {
    if (gameType === "Valorant") {
      const newMembers = Array.from({ length: 5 }, () => ({ name: "", contact: "", email: "" }));
      setFormData({
        ...formData,
        gameType,
        gameMode: "",
        teamSize: "5",
        members: newMembers,
      });
    } else if (gameType === "Freefire" || gameType === "BGMI") {
      setFormData({
        ...formData,
        gameType,
        gameMode: "",
        teamSize: "",
        members: [],
      });
    } else {
      setFormData({
        ...formData,
        gameType,
        gameMode: "",
        teamSize: "",
        members: [],
      });
    }
    setErrors({});
  };

  const handleGameModeChange = (gameMode: string) => {
    const count = gameMode === "Duo" ? 2 : 4;
    const newMembers = Array.from({ length: count }, () => ({
      name: "",
      contact: "",
      email: "",
    }));
    setFormData({ ...formData, gameMode, teamSize: count.toString(), members: newMembers });
    if (errors.gameMode) {
      const newErrors = { ...errors };
      delete newErrors.gameMode;
      setErrors(newErrors);
    }
  };

  const handleTeamSizeChange = (size: string) => {
    const count = parseInt(size, 10);
    const newMembers = [...formData.members];

    // Resize array
    if (count > newMembers.length) {
      for (let i = newMembers.length; i < count; i++) {
        newMembers.push({ name: "", contact: "", email: "" });
      }
    } else {
      newMembers.length = count;
    }

    setFormData({ ...formData, teamSize: size, members: newMembers });
  };

  const getTeamSizeOptions = (eventType: string) => {
    if (eventType === "CineQuest" || eventType === "Innovex" || eventType === "Spiral")
      return ["2", "3", "4"];
    return ["1"];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onNext({
          name: formData.members[0].name,
          contact: formData.members[0].contact,
          email: formData.members[0].email,
          eventType: formData.eventType,
          gameType: formData.gameType,
          gameMode: formData.gameMode,
          teamSize: formData.teamSize,
          collegeName: formData.collegeName,
          teamName: formData.teamName,
          referedBy: formData.referedBy,
        });
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          (errorData && (errorData.error || errorData.message)) ||
          "Failed to submit form";
        setErrors({ form: errorMessage });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Form submission exception:", error);
      setErrors({ form: "An error occurred. Please try again." });
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-md"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h2 className="text-3xl font-bold text-zinc-50 mb-2">
          Event Registration
        </h2>
        <p className="text-zinc-400">Please provide your team details below</p>
      </motion.div>

      {errors.form && (
        <motion.div
          variants={itemVariants}
          className="mb-6 p-4 bg-red-950 border border-red-800 rounded-lg text-red-200"
        >
          {errors.form}
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="mb-6 relative z-50">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Event Type
        </label>
        <select
          value={formData.eventType}
          onChange={(e) => handleEventTypeChange(e.target.value)}
          className="w-full h-12 px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 appearance-none cursor-pointer"
        >
          <option value="" disabled className="bg-zinc-900 text-zinc-500">
            Select Event Type
          </option>
          <option value="CineQuest" className="bg-zinc-900 text-zinc-50">
            CineQuest
          </option>
          <option value="Innovex" className="bg-zinc-900 text-zinc-50">
            Innovex
          </option>
          <option
            value="Contentflux"
            className="bg-zinc-900 text-zinc-50"
          >
            Contentflux
          </option>
          <option value="Geovoyager" className="bg-zinc-900 text-zinc-50">
            Geovoyager
          </option>
          <option value="BattleGrid" className="bg-zinc-900 text-zinc-50">
            BattleGrid
          </option>
          <option value="Spiral" className="bg-zinc-900 text-zinc-50">
            Spiral
          </option>
        </select>
        {/* Custom arrow icon since appearance-none hides the default one */}
        <div className="pointer-events-none absolute inset-y-0 right-0 top-7 flex items-center px-4 text-zinc-400">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        {errors.eventType && (
          <p className="text-red-400 text-sm mt-2">{errors.eventType}</p>
        )}
      </motion.div>

      {formData.eventType && (
          <>
            {formData.eventType === "BattleGrid" ? (
              <>
                <motion.div variants={itemVariants} className="mb-6">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Game
                  </label>
                  <select
                    value={formData.gameType}
                    onChange={(e) => handleGameTypeChange(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-zinc-900 border border-zinc-700 text-zinc-50 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  >
                    <option value="" disabled>
                      Select Game
                    </option>
                    <option value="Valorant">Valorant</option>
                    <option value="Freefire">Freefire</option>
                    <option value="BGMI">BGMI</option>
                  </select>
                  {errors.gameType && (
                    <p className="text-red-400 text-sm mt-2">{errors.gameType}</p>
                  )}
                </motion.div>

                {(formData.gameType === "Freefire" || formData.gameType === "BGMI") && (
                  <motion.div variants={itemVariants} className="mb-6">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Mode
                    </label>
                    <select
                      value={formData.gameMode}
                      onChange={(e) => handleGameModeChange(e.target.value)}
                      className="w-full h-10 px-3 py-2 bg-zinc-900 border border-zinc-700 text-zinc-50 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      <option value="" disabled>
                        Select Mode
                      </option>
                      <option value="Duo">Duo</option>
                      <option value="Squad">Squad</option>
                    </select>
                    {errors.gameMode && (
                      <p className="text-red-400 text-sm mt-2">{errors.gameMode}</p>
                    )}
                  </motion.div>
                )}
              </>
            ) : (
              formData.eventType !== "Contentflux" &&
              formData.eventType !== "Geovoyager" && (
              <motion.div variants={itemVariants} className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Team Size
                </label>
                <select
                  value={formData.teamSize}
                  onChange={(e) => handleTeamSizeChange(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-zinc-900 border border-zinc-700 text-zinc-50 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  {getTeamSizeOptions(formData.eventType).map((size) => (
                    <option key={size} value={size}>
                      {size} Member{size !== "1" ? "s" : ""}
                    </option>
                  ))}
                </select>
              </motion.div>
            )
            )}

            <motion.div variants={itemVariants} className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                College Name
              </label>
              <Input
                type="text"
                placeholder="Enter your college name"
                value={formData.collegeName}
                onChange={(e) => {
                  setFormData({ ...formData, collegeName: e.target.value });
                  if (errors.collegeName)
                    setErrors({ ...errors, collegeName: "" });
                }}
                className="w-full bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-zinc-500"
              />
              {errors.collegeName && (
                <p className="text-red-400 text-sm mt-2">
                  {errors.collegeName}
                </p>
              )}
            </motion.div>

            {formData.eventType && (
              <motion.div variants={itemVariants} className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Team Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your team name"
                  value={formData.teamName}
                  onChange={(e) => {
                    setFormData({ ...formData, teamName: e.target.value });
                    if (errors.teamName)
                      setErrors({ ...errors, teamName: "" });
                  }}
                  className="w-full bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-zinc-500"
                />
                {errors.teamName && (
                  <p className="text-red-400 text-sm mt-2">
                    {errors.teamName}
                  </p>
                )}
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Refered By (Optional)
              </label>
              <Input
                type="text"
                placeholder="Name of person who refered you"
                value={formData.referedBy}
                onChange={(e) => {
                  setFormData({ ...formData, referedBy: e.target.value });
                }}
                className="w-full bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-zinc-500"
              />
            </motion.div>

            {formData.members.map((member, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="mb-6 p-4 border border-zinc-800 rounded-lg bg-zinc-900/50"
              >
                <h3 className="text-lg font-medium text-zinc-200 mb-4 border-b border-zinc-800 pb-2">
                  {index === 0 ? "Member 1 (Captain)" : `Member ${index + 1}`}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Name
                    </label>
                    <Input
                      type="text"
                      placeholder={`Enter ${index === 0 ? "Captain" : `Member ${index + 1}`} Name`}
                      value={member.name}
                      onChange={(e) =>
                        handleMemberChange(index, "name", e.target.value)
                      }
                      className="w-full bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-zinc-500"
                    />
                    {errors[`name_${index}`] && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors[`name_${index}`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Contact Number
                    </label>
                    <Input
                      type="tel"
                      placeholder={`Enter ${index === 0 ? "Captain" : `Member ${index + 1}`} Contact`}
                      value={member.contact}
                      onChange={(e) =>
                        handleMemberChange(index, "contact", e.target.value)
                      }
                      className="w-full bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-zinc-500"
                    />
                    {errors[`contact_${index}`] && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors[`contact_${index}`]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder={`Enter ${index === 0 ? "Captain" : `Member ${index + 1}`} Email`}
                      value={member.email}
                      onChange={(e) =>
                        handleMemberChange(index, "email", e.target.value)
                      }
                      className="w-full bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-zinc-500"
                    />
                    {errors[`email_${index}`] && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors[`email_${index}`]}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}

      <motion.div variants={itemVariants}>
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !formData.eventType
          }
          className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200 font-semibold h-12 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Submitting...
            </span>
          ) : "Continue to Payment"}
        </Button>
      </motion.div>
    </motion.form>
  );
}