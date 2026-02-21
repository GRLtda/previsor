import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    itemsPerPage?: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    isLoading,
}: PaginationProps) {
    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            onPageChange(page);
        }
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page
        if (startPage > 1) {
            pages.push(
                <Button
                    key={1}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                >
                    1
                </Button>
            );
            if (startPage > 2) {
                pages.push(
                    <span key="ellipsis-start" className="flex items-center px-1 text-muted-foreground">
                        ...
                    </span>
                );
            }
        }

        // Visible pages
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={i}
                    variant={currentPage === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(i)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                >
                    {i}
                </Button>
            );
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(
                    <span key="ellipsis-end" className="flex items-center px-1 text-muted-foreground">
                        ...
                    </span>
                );
            }
            pages.push(
                <Button
                    key={totalPages}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={isLoading}
                    className="h-8 w-8 p-0"
                >
                    {totalPages}
                </Button>
            );
        }

        return pages;
    };

    if (totalPages <= 1 && !totalItems) return null;

    const startItem = itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = itemsPerPage && totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

    return (
        <div className="flex items-center justify-between px-2 py-4 border-t">
            <div className="flex-1 text-sm text-muted-foreground font-medium">
                {totalItems !== undefined && itemsPerPage !== undefined
                    ? `Mostrando ${startItem}-${endItem} de ${totalItems} registros`
                    : `Página ${currentPage} de ${totalPages}`}
            </div>
            {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!canGoPrevious || isLoading}
                        className="h-8 gap-1 pl-2.5"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Anterior</span>
                    </Button>

                    <div className="flex items-center space-x-1">
                        {renderPageNumbers()}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!canGoNext || isLoading}
                        className="h-8 gap-1 pr-2.5"
                    >
                        <span className="hidden sm:inline">Próximo</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
