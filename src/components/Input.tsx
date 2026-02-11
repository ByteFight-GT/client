import React from "react"

import { cn } from "@/lib/utils";
import { FolderIcon } from "lucide-react";

export interface InputProps extends React.ComponentProps<"input"> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className = "", ...props }, ref) => {
		const [selectedFile, setSelectedFile] = React.useState<string>("");
		
		// special file input
		if (props.type === "file") {
			const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
				const files = e.target.files;
				if (files && files.length > 0) {
					setSelectedFile(files[0].name);
				} else {
					setSelectedFile("");
				}
				// Call the original onChange if provided
				props.onChange?.(e);
			};

			const handleClick = () => {
				if (ref && typeof ref !== 'function') {
					ref.current?.click();
				}
			};

			return (
				<>
					<input
						ref={ref}
						type="file"
						{...props}
						onChange={handleFileChange}
						style={{ display: "none" }}
					/>
					<div
						onClick={handleClick}
						className={cn(
							"w-full border border-border bg-secondary text-sm px-3 py-1 transition-all duration-100 cursor-pointer flex items-center gap-2",
							"disabled:cursor-not-allowed disabled:opacity-50 hover:bg-secondary/80",
							className
						)}
					>
						<FolderIcon />
						<span className="text-foreground truncate">
							{selectedFile || "No file selected"}
						</span>
					</div>
				</>
			);
		}

		// all other (non-file) types
		return (
			<input
			className={cn(
				"w-full border border-border bg-secondary text-sm px-3 py-1 transition-all duration-100",
				"placeholder:text-muted-foreground",
				"disabled:cursor-not-allowed disabled:opacity-50",
				"file:border-0 file:bg-transparent file:font-medium file:text-foreground",
				className
			)}
			ref={ref}
			{...props} />
		)
	}
)
Input.displayName = "Input"

export { Input }
